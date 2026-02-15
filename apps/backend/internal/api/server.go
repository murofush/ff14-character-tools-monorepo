package api

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/ff14/achievement-backend/internal/apperrors"
)

var (
	editedAchievementPathRegexp = regexp.MustCompile(`^editedAchievementData/[a-z0-9_]+/[a-z0-9_]+\.json$`)
	tagPathRegexp               = regexp.MustCompile(`^tag/tag\.json$`)
	patchPathRegexp             = regexp.MustCompile(`^patch/patch\.json$`)
	characterProfileRegexp      = regexp.MustCompile(`^https://(jp|na|eu|fr|de).finalfantasyxiv.com/lodestone/character/([0-9]+)/?$`)
	characterRegexp             = regexp.MustCompile(`^https://(jp|na|eu|fr|de).finalfantasyxiv.com/lodestone/character/[0-9]+/achievement/detail/[0-9a-zA-Z]+/?$`)
	itemRegexp                  = regexp.MustCompile(`^https://(jp|na|eu|fr|de).finalfantasyxiv.com/lodestone/playguide/db/item/[0-9a-zA-Z]+/?$`)
	iconRegexp                  = regexp.MustCompile(`^https://img.finalfantasyxiv.com/lds/pc/global/images/itemicon/[0-9a-zA-Z]+/[0-9a-zA-Z]+\.(jpg|png|gif)(\?.*)?$`)
)

type ErrorMode string

const (
	ErrorModeCompat ErrorMode = "compat"
	ErrorModeHTTP   ErrorMode = "http"
)

type Config struct {
	StrictJSONValidation  bool
	ErrorMode             ErrorMode
	RequestTimeout        time.Duration
	SaveTextRatePerMinute int
	GetRatePerMinute      int
}

type TokenValidator interface {
	ValidateToken(ctx context.Context, token string) (string, error)
}

type TextStorage interface {
	SaveText(ctx context.Context, path string, body []byte) error
	SaveBinary(ctx context.Context, path string, body []byte, contentType string) error
}

type LocalError struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type SaveTextRequest struct {
	Text string `json:"text"`
	Path string `json:"path"`
}

type SaveTextResponse struct {
	OK        bool   `json:"ok"`
	Path      string `json:"path"`
	Bytes     int    `json:"bytes"`
	UpdatedAt string `json:"updatedAt"`
}

type ResponseData struct {
	CharacterID               int                         `json:"characterID"`
	FetchedDate               time.Time                   `json:"fetchedDate"`
	CharacterData             map[string]any              `json:"characterData"`
	CompletedAchievementsKind []CompletedAchievementsKind `json:"completedAchievementsKinds"`
	IsAchievementPrivate      bool                        `json:"isAchievementPrivate"`
}

type CompletedAchievementsKind struct {
	Key          string                 `json:"key"`
	Achievements []CompletedAchievement `json:"achievements"`
}

type CompletedAchievement struct {
	Title         string    `json:"title"`
	CompletedDate time.Time `json:"completedDate"`
}

type EditAchievement struct {
	Title              string   `json:"title"`
	Description        string   `json:"description"`
	IconURL            string   `json:"iconUrl"`
	IconPath           string   `json:"iconPath"`
	Point              int      `json:"point"`
	IsLatestPatch      bool     `json:"isLatestPatch"`
	IsCreated          bool     `json:"isCreated"`
	IsEdited           bool     `json:"isEdited"`
	IsNowCreated       bool     `json:"isNowCreated"`
	SourceIndex        int      `json:"sourceIndex"`
	TagIDs             []int    `json:"tagIds"`
	AdjustmentPatchID  int      `json:"adjustmentPatchId"`
	PatchID            int      `json:"patchId"`
	TitleAward         string   `json:"titleAward,omitempty"`
	TitleAwardMan      string   `json:"titleAwardMan,omitempty"`
	TitleAwardWoman    string   `json:"titleAwardWoman,omitempty"`
	ItemAward          string   `json:"itemAward,omitempty"`
	ItemAwardURL       string   `json:"itemAwardUrl,omitempty"`
	ItemAwardImageURL  string   `json:"itemAwardImageUrl,omitempty"`
	ItemAwardImagePath string   `json:"itemAwardImagePath,omitempty"`
	AwardCondition     []string `json:"awardCondition,omitempty"`
	URL                string   `json:"url,omitempty"`
}

type FetchedItemData struct {
	ItemAward          string `json:"itemAward"`
	ItemAwardURL       string `json:"itemAwardUrl"`
	ItemAwardImageURL  string `json:"itemAwardImageUrl"`
	ItemAwardImagePath string `json:"itemAwardImagePath"`
}

type Server struct {
	config         Config
	tokenValidator TokenValidator
	textStorage    TextStorage
	rateLimiter    RateLimiter
	mux            *http.ServeMux
	httpClient     *http.Client
}

// 目的: APIサーバの依存関係とルーティングを初期化する。副作用: ルーティングテーブルを構築する。前提: tokenValidatorとtextStorageがnilではない。
func NewServer(config Config, tokenValidator TokenValidator, textStorage TextStorage) *Server {
	timeout := config.RequestTimeout
	if timeout <= 0 {
		timeout = 15 * time.Second
	}
	saveTextRatePerMinute := config.SaveTextRatePerMinute
	if saveTextRatePerMinute <= 0 {
		saveTextRatePerMinute = 20
	}
	getRatePerMinute := config.GetRatePerMinute
	if getRatePerMinute <= 0 {
		getRatePerMinute = 60
	}
	config.SaveTextRatePerMinute = saveTextRatePerMinute
	config.GetRatePerMinute = getRatePerMinute
	server := &Server{
		config:         config,
		tokenValidator: tokenValidator,
		textStorage:    textStorage,
		rateLimiter:    NewInMemoryRateLimiter(saveTextRatePerMinute, getRatePerMinute),
		mux:            http.NewServeMux(),
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
	server.routes()
	return server
}

// 目的: サーバのHTTPハンドラを外部公開する。副作用: なし。前提: NewServerで初期化済みである。
func (s *Server) Handler() http.Handler {
	return s.withRequestLogging(s.mux)
}

// 目的: APIエンドポイントを登録する。副作用: ServeMuxへハンドラを設定する。前提: サーバ初期化処理中に1回だけ呼ばれる。
func (s *Server) routes() {
	s.mux.HandleFunc("/api/get_character_info", s.handleGetCharacterInfo)
	s.mux.HandleFunc("/api/save_text", s.withAuth(s.handleSaveText))
	s.mux.HandleFunc("/api/get_hidden_achievement", s.withAuth(s.handleGetHiddenAchievement))
	s.mux.HandleFunc("/api/get_icon_img", s.withAuth(s.handleGetIconImg))
	s.mux.HandleFunc("/api/get_item_infomation", s.withAuth(s.handleGetItemInfomation))
}

// 目的: 公開のキャラクター取得API契約に従いLodestoneページから基本情報を返す。副作用: 外部サイトへHTTPアクセスしレート制限カウンタを更新する。前提: urlクエリはLodestoneのキャラクターページURLである。
func (s *Server) handleGetCharacterInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !s.rateLimiter.Allow(publicRequesterKey(r), r.URL.Path) {
		http.Error(w, "too many requests", http.StatusTooManyRequests)
		return
	}
	rawURL := strings.TrimSpace(r.URL.Query().Get("url"))
	if rawURL == "" {
		writeJSON(w, http.StatusBadRequest, LocalError{Key: "url_invalid", Value: "URLを設定してください。"})
		return
	}
	normalizedURL := normalizeProfileURL(rawURL)
	matchedProfileURL := characterProfileRegexp.FindStringSubmatch(normalizedURL)
	if len(matchedProfileURL) < 2 {
		writeJSON(w, http.StatusBadRequest, LocalError{Key: "url_invalid", Value: "URLはloadstoneのキャラクターページを貼ってください。"})
		return
	}
	characterID, err := strconv.Atoi(matchedProfileURL[len(matchedProfileURL)-1])
	if err != nil {
		writeJSON(w, http.StatusBadRequest, LocalError{Key: "url_invalid", Value: "URLはloadstoneのキャラクターページを貼ってください。"})
		return
	}
	responseData, err := s.fetchCharacterInfo(r.Context(), normalizedURL, characterID)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, LocalError{Key: "fetch_character_error", Value: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, responseData)
}

// 目的: Bearerトークン必須の認証ミドルウェアを適用する。副作用: 不正認証時にレスポンスを書き込み処理を中断する。前提: AuthorizationヘッダにBearer形式でトークンが渡される。
func (s *Server) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		if token == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		uid, err := s.tokenValidator.ValidateToken(r.Context(), token)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		if !s.rateLimiter.Allow(uid, r.URL.Path) {
			if strings.HasPrefix(r.URL.Path, "/api/get_") && s.config.ErrorMode == ErrorModeCompat {
				writeJSON(w, http.StatusOK, LocalError{Key: "rate_limit_exceeded", Value: "request rate limit exceeded"})
				return
			}
			http.Error(w, "too many requests", http.StatusTooManyRequests)
			return
		}
		ctx := context.WithValue(r.Context(), contextKeyActorUID, uid)
		next(w, r.WithContext(ctx))
	}
}

// 目的: save_text契約に従い編集済みJSONを保存する。副作用: ストレージへ書き込みを行う。前提: 認証済みかつPOSTメソッドで呼び出される。
func (s *Server) handleSaveText(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req SaveTextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Text) == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}
	if !isAllowedSavePath(req.Path) {
		http.Error(w, "path is not allowed", http.StatusBadRequest)
		return
	}
	if s.config.StrictJSONValidation && !json.Valid([]byte(req.Text)) {
		http.Error(w, "text is not valid json", http.StatusBadRequest)
		return
	}
	if err := s.textStorage.SaveText(r.Context(), req.Path, []byte(req.Text)); err != nil {
		if errors.Is(err, apperrors.ErrPermissionDenied) {
			http.Error(w, "permission denied", http.StatusForbidden)
			return
		}
		http.Error(w, "failed to save text", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, SaveTextResponse{
		OK:        true,
		Path:      req.Path,
		Bytes:     len(req.Text),
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	})
}

// 目的: Lodestoneアチーブメント詳細URLから編集用データを抽出して返す。副作用: 外部サイトへHTTPアクセスする。前提: 互換モード時は失敗をLocalErrorで返す。
func (s *Server) handleGetHiddenAchievement(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query()
	targetURL := strings.TrimSpace(query.Get("url"))
	category := strings.TrimSpace(query.Get("category"))
	group := strings.TrimSpace(query.Get("group"))
	if targetURL == "" || category == "" || group == "" {
		s.respondLocalError(w, http.StatusBadRequest, "missing_parameter", "url, category, group is required")
		return
	}
	if !characterRegexp.MatchString(targetURL) {
		s.respondLocalError(w, http.StatusBadRequest, "invalid_url", "character achievement url is invalid")
		return
	}
	result, err := s.fetchHiddenAchievement(r.Context(), targetURL, category, group)
	if err != nil {
		s.respondLocalError(w, http.StatusBadGateway, "fetch_hidden_achievement_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// 目的: アイコンURLを検証し格納パスを返す。副作用: なし。前提: 互換モード時は失敗をLocalErrorで返す。
func (s *Server) handleGetIconImg(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query()
	iconURL := strings.TrimSpace(query.Get("url"))
	category := strings.TrimSpace(query.Get("category"))
	group := strings.TrimSpace(query.Get("group"))
	if iconURL == "" || category == "" || group == "" {
		s.respondLocalError(w, http.StatusBadRequest, "missing_parameter", "url, category, group is required")
		return
	}
	if !iconRegexp.MatchString(iconURL) {
		s.respondLocalError(w, http.StatusBadRequest, "invalid_icon_url", "icon url is invalid")
		return
	}
	iconName := extractLoadstoneImageName(iconURL)
	iconPath := fmt.Sprintf("achievementData/img/%s/%s/%s", category, group, iconName)
	imageBody, contentType, err := s.fetchBinary(r.Context(), iconURL)
	if err != nil {
		s.respondLocalError(w, http.StatusBadGateway, "fetch_icon_image_error", err.Error())
		return
	}
	if err := s.textStorage.SaveBinary(r.Context(), iconPath, imageBody, contentType); err != nil {
		s.respondLocalError(w, http.StatusInternalServerError, "save_icon_image_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, iconPath)
}

// 目的: LodestoneアイテムURLから最低限のアイテム情報を返す。副作用: 外部サイトへHTTPアクセスする。前提: 互換モード時は失敗をLocalErrorで返す。
func (s *Server) handleGetItemInfomation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query()
	itemURL := strings.TrimSpace(query.Get("url"))
	category := strings.TrimSpace(query.Get("category"))
	group := strings.TrimSpace(query.Get("group"))
	if itemURL == "" || category == "" || group == "" {
		s.respondLocalError(w, http.StatusBadRequest, "missing_parameter", "url, category, group is required")
		return
	}
	if !itemRegexp.MatchString(itemURL) {
		s.respondLocalError(w, http.StatusBadRequest, "invalid_item_url", "item url is invalid")
		return
	}
	data, err := s.fetchItemInfo(r.Context(), itemURL, category, group)
	if err != nil {
		s.respondLocalError(w, http.StatusBadGateway, "fetch_item_information_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, data)
}

// 目的: save_text保存先の許可パス判定を行う。副作用: なし。前提: pathは相対パス文字列である。
func isAllowedSavePath(path string) bool {
	return editedAchievementPathRegexp.MatchString(path) || tagPathRegexp.MatchString(path) || patchPathRegexp.MatchString(path)
}

// 目的: 互換モード設定に応じてLocalErrorレスポンスを返す。副作用: ステータスコードとレスポンスボディを書き込む。前提: keyとvalueはエラー原因を表現する。
func (s *Server) respondLocalError(w http.ResponseWriter, status int, key string, value string) {
	if s.config.ErrorMode == ErrorModeCompat {
		writeJSON(w, http.StatusOK, LocalError{Key: key, Value: value})
		return
	}
	writeJSON(w, status, LocalError{Key: key, Value: value})
}

// 目的: JSONレスポンスを共通形式で返す。副作用: レスポンスヘッダとボディを書き込む。前提: bodyはJSONエンコード可能である。
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// 目的: Lodestoneページから最低限のアチーブメント情報を抽出する。副作用: 外部サイトへHTTPアクセスする。前提: URLはキャラクターアチーブメント詳細URLである。
func (s *Server) fetchHiddenAchievement(ctx context.Context, targetURL string, category string, group string) (EditAchievement, error) {
	htmlBody, err := s.fetchHTML(ctx, targetURL)
	if err != nil {
		return EditAchievement{}, err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlBody))
	if err != nil {
		return EditAchievement{}, err
	}
	title := strings.TrimSpace(doc.Find(".db-view__achievement__text__name").First().Text())
	description := strings.TrimSpace(doc.Find(".db-view__achievement__help").First().Text())
	iconURL, _ := doc.Find(".db-view__achievement__icon__image").First().Attr("src")
	pointText := strings.TrimSpace(doc.Find(".db-view__achievement__point").First().Text())
	point, _ := strconv.Atoi(pointText)
	if title == "" || description == "" || iconURL == "" {
		return EditAchievement{}, errors.New("required achievement fields are missing")
	}
	iconPath := fmt.Sprintf("achievementData/img/%s/%s/%s", category, group, extractLoadstoneImageName(iconURL))
	return EditAchievement{
		Title:             title,
		Description:       description,
		IconURL:           iconURL,
		IconPath:          iconPath,
		Point:             point,
		IsLatestPatch:     doc.Find(".latest_patch__major__icon").Length() > 0,
		IsCreated:         true,
		IsEdited:          true,
		IsNowCreated:      true,
		SourceIndex:       -1,
		TagIDs:            []int{},
		AdjustmentPatchID: 0,
		PatchID:           0,
		URL:               targetURL,
	}, nil
}

// 目的: Lodestoneアイテムページから最低限のアイテム情報を抽出する。副作用: 外部サイトへHTTPアクセスする。前提: URLはLodestoneアイテム詳細URLである。
func (s *Server) fetchItemInfo(ctx context.Context, itemURL string, category string, group string) (FetchedItemData, error) {
	htmlBody, err := s.fetchHTML(ctx, itemURL)
	if err != nil {
		return FetchedItemData{}, err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlBody))
	if err != nil {
		return FetchedItemData{}, err
	}
	name := strings.TrimSpace(doc.Find(".db-view__item__text__name").First().Text())
	imageURL, exists := doc.Find(".db-view__item__icon__item_image").First().Attr("src")
	if !exists || imageURL == "" {
		imageURL, _ = doc.Find("meta[property='og:image']").Attr("content")
	}
	if name == "" {
		name = strings.TrimSpace(doc.Find("meta[property='og:title']").AttrOr("content", ""))
	}
	if name == "" || imageURL == "" {
		return FetchedItemData{}, errors.New("required item fields are missing")
	}
	itemPath := fmt.Sprintf("achievementData/img/%s/%s/item/%s", category, group, extractLoadstoneImageName(imageURL))
	imageBody, contentType, err := s.fetchBinary(ctx, imageURL)
	if err != nil {
		return FetchedItemData{}, err
	}
	if err := s.textStorage.SaveBinary(ctx, itemPath, imageBody, contentType); err != nil {
		return FetchedItemData{}, err
	}
	return FetchedItemData{
		ItemAward:          name,
		ItemAwardURL:       itemURL,
		ItemAwardImageURL:  imageURL,
		ItemAwardImagePath: itemPath,
	}, nil
}

// 目的: 外部HTMLを取得する共通処理を提供する。副作用: HTTPリクエストを送信する。前提: targetURLはhttp/https形式である。
func (s *Server) fetchHTML(ctx context.Context, targetURL string) (string, error) {
	parsedURL, err := url.ParseRequestURI(targetURL)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		return "", err
	}
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("failed to fetch html: status=%d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

// 目的: 外部URLからバイナリを取得する共通処理を提供する。副作用: HTTPリクエストを送信する。前提: targetURLはhttp/https形式である。
func (s *Server) fetchBinary(ctx context.Context, targetURL string) ([]byte, string, error) {
	parsedURL, err := url.ParseRequestURI(targetURL)
	if err != nil {
		return nil, "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		return nil, "", err
	}
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, "", fmt.Errorf("failed to fetch binary: status=%d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}
	return body, resp.Header.Get("Content-Type"), nil
}

// 目的: Lodestoneキャラクターページから旧互換のResponseDataを構築する。副作用: 外部サイトへHTTPアクセスする。前提: targetURLは正規化済みキャラクターページURLである。
func (s *Server) fetchCharacterInfo(ctx context.Context, targetURL string, characterID int) (ResponseData, error) {
	htmlBody, err := s.fetchHTML(ctx, targetURL)
	if err != nil {
		return ResponseData{}, err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlBody))
	if err != nil {
		return ResponseData{}, err
	}
	nameText := strings.TrimSpace(doc.Find(".frame__chara__name").First().Text())
	if nameText == "" {
		return ResponseData{}, errors.New("character name is missing")
	}
	firstName, lastName := splitCharacterName(nameText)
	worldText := strings.TrimSpace(doc.Find(".frame__chara__world").First().Text())
	server, datacenter := splitServerAndDatacenter(worldText)
	characterProfile := map[string]any{
		"firstName":        firstName,
		"lastName":         lastName,
		"selfintroduction": emptyTextToNil(strings.TrimSpace(doc.Find(".character__selfintroduction").First().Text())),
		"server":           server,
		"datacenter":       datacenter,
		"race":             "",
		"clan":             "",
		"gender":           "",
		"birthMonth":       "",
		"birthDay":         "",
		"battleRoles":      buildDefaultBattleRoles(),
		"crafter":          buildDefaultCrafter(),
		"gatherer":         buildDefaultGatherer(),
	}
	return ResponseData{
		CharacterID:               characterID,
		FetchedDate:               time.Now().UTC(),
		CharacterData:             characterProfile,
		CompletedAchievementsKind: []CompletedAchievementsKind{},
		IsAchievementPrivate:      false,
	}, nil
}

// 目的: 公開APIのレート制限キーをリクエストから生成する。副作用: なし。前提: RemoteAddrが`host:port`形式または空文字である。
func publicRequesterKey(r *http.Request) string {
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return "public:" + host
	}
	if strings.TrimSpace(r.RemoteAddr) != "" {
		return "public:" + strings.TrimSpace(r.RemoteAddr)
	}
	return "public:unknown"
}

// 目的: URL入力からクエリ/フラグメント/末尾スラッシュを除去し検証用に正規化する。副作用: なし。前提: rawURLはユーザー入力文字列である。
func normalizeProfileURL(rawURL string) string {
	trimmed := strings.TrimSpace(rawURL)
	withoutFragment := strings.SplitN(trimmed, "#", 2)[0]
	withoutQuery := strings.SplitN(withoutFragment, "?", 2)[0]
	return strings.TrimSuffix(withoutQuery, "/")
}

// 目的: キャラクター名文字列から姓・名を抽出する。副作用: なし。前提: textはLodestone表示名を含む。
func splitCharacterName(text string) (string, string) {
	parts := strings.Fields(strings.TrimSpace(text))
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

// 目的: ワールド/DC表示文字列からserverとdatacenterを抽出する。副作用: なし。前提: textは`Server (DC)`形式を想定する。
func splitServerAndDatacenter(text string) (string, string) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return "", ""
	}
	matched := regexp.MustCompile(`^(.*?)\s*\((.*?)\)$`).FindStringSubmatch(trimmed)
	if len(matched) == 3 {
		return strings.TrimSpace(matched[1]), strings.TrimSpace(matched[2])
	}
	return trimmed, ""
}

// 目的: 空文字をnilへ変換して旧契約のnullable文字列に合わせる。副作用: なし。前提: textはtrim済み文字列である。
func emptyTextToNil(text string) any {
	if strings.TrimSpace(text) == "" {
		return nil
	}
	return text
}

// 目的: 旧契約互換の戦闘ジョブレベル初期値を返す。副作用: なし。前提: レベル情報未取得時は0で初期化する。
func buildDefaultBattleRoles() map[string]any {
	return map[string]any{
		"tankRole": map[string]any{
			"paladin":    map[string]any{"level": 0},
			"warrior":    map[string]any{"level": 0},
			"darkKnight": map[string]any{"level": 0},
			"gunbreaker": map[string]any{"level": 0},
		},
		"healerRole": map[string]any{
			"whiteMage":   map[string]any{"level": 0},
			"scholar":     map[string]any{"level": 0},
			"astrologian": map[string]any{"level": 0},
		},
		"dpsRole": map[string]any{
			"meleeDps": map[string]any{
				"monk":    map[string]any{"level": 0},
				"dragoon": map[string]any{"level": 0},
				"ninja":   map[string]any{"level": 0},
				"samurai": map[string]any{"level": 0},
			},
			"physicalRangedDps": map[string]any{
				"bard":      map[string]any{"level": 0},
				"machinist": map[string]any{"level": 0},
				"dancer":    map[string]any{"level": 0},
			},
			"magicalRangedDps": map[string]any{
				"blackMage": map[string]any{"level": 0},
				"summoner":  map[string]any{"level": 0},
				"redMage":   map[string]any{"level": 0},
			},
			"limitedDps": map[string]any{
				"blueMage": map[string]any{"level": 0},
			},
		},
	}
}

// 目的: 旧契約互換のクラフタージョブレベル初期値を返す。副作用: なし。前提: レベル情報未取得時は0で初期化する。
func buildDefaultCrafter() map[string]any {
	return map[string]any{
		"carpenter":     map[string]any{"level": 0},
		"blacksmith":    map[string]any{"level": 0},
		"armorer":       map[string]any{"level": 0},
		"goldsmith":     map[string]any{"level": 0},
		"leatherworker": map[string]any{"level": 0},
		"weaver":        map[string]any{"level": 0},
		"alchemist":     map[string]any{"level": 0},
		"culinarian":    map[string]any{"level": 0},
	}
}

// 目的: 旧契約互換のギャザラージョブレベル初期値を返す。副作用: なし。前提: レベル情報未取得時は0で初期化する。
func buildDefaultGatherer() map[string]any {
	return map[string]any{
		"miner":    map[string]any{"level": 0},
		"botanist": map[string]any{"level": 0},
		"fisher":   map[string]any{"level": 0},
	}
}

// 目的: Lodestone画像URLからファイル名部分を取り出す。副作用: なし。前提: URLはパス末尾にファイル名を含む。
func extractLoadstoneImageName(targetURL string) string {
	if idx := strings.Index(targetURL, "?"); idx >= 0 {
		targetURL = targetURL[:idx]
	}
	parts := strings.Split(strings.TrimSpace(targetURL), "/")
	if len(parts) == 0 {
		return hashedFileName(targetURL) + ".png"
	}
	last := parts[len(parts)-1]
	if strings.TrimSpace(last) == "" {
		return hashedFileName(targetURL) + ".png"
	}
	return last
}

// 目的: URL文字列から疑似ファイル名を生成する。副作用: なし。前提: 同一入力で同一出力が必要である。
func hashedFileName(value string) string {
	hash := sha1.Sum([]byte(value))
	return hex.EncodeToString(hash[:])
}
