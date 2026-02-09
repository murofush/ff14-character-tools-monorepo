package api

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	s.mux.HandleFunc("/api/save_text", s.withAuth(s.handleSaveText))
	s.mux.HandleFunc("/api/get_hidden_achievement", s.withAuth(s.handleGetHiddenAchievement))
	s.mux.HandleFunc("/api/get_icon_img", s.withAuth(s.handleGetIconImg))
	s.mux.HandleFunc("/api/get_item_infomation", s.withAuth(s.handleGetItemInfomation))
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
