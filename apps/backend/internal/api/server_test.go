package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"testing"

	"github.com/ff14/achievement-backend/internal/apperrors"
)

type stubAuth struct {
	uid string
	err error
}

// 目的: 認証検証のテスト差し替えを可能にする。副作用: なし。前提: token文字列が渡される。
func (s stubAuth) ValidateToken(_ context.Context, _ string) (string, error) {
	return s.uid, s.err
}

type stubStorage struct {
	savedPath              string
	savedBody              []byte
	savedBinaryPath        string
	savedBinaryBody        []byte
	savedBinaryContentType string
	err                    error
	binaryErr              error
}

// 目的: 保存処理のテスト差し替えを可能にする。副作用: 内部状態に保存結果を記録する。前提: pathとbodyが妥当な入力として渡される。
func (s *stubStorage) SaveText(_ context.Context, path string, body []byte) error {
	s.savedPath = path
	s.savedBody = body
	return s.err
}

// 目的: バイナリ保存処理のテスト差し替えを可能にする。副作用: 内部状態に保存結果を記録する。前提: pathとbodyが妥当な入力として渡される。
func (s *stubStorage) SaveBinary(_ context.Context, path string, body []byte, contentType string) error {
	s.savedBinaryPath = path
	s.savedBinaryBody = body
	s.savedBinaryContentType = contentType
	return s.binaryErr
}

// 目的: save_textの認証必須契約を検証する。副作用: なし。前提: サーバがミドルウェア経由で認証判定する。
func TestSaveText_Unauthorized(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{}, &stubStorage{})

	body := []byte(`{"text":"{}","path":"tag/tag.json"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/save_text", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("want status 401, got %d", rec.Code)
	}
}

// 目的: save_textのpath制限契約を検証する。副作用: なし。前提: 認証済みリクエストである。
func TestSaveText_InvalidPath(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	body := []byte(`{"text":"{}","path":"../../etc/passwd"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/save_text", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer test-token")
	rec := httptest.NewRecorder()

	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want status 400, got %d", rec.Code)
	}
}

// 目的: save_textの厳格JSON検証を検証する。副作用: なし。前提: StrictJSONValidation=trueである。
func TestSaveText_StrictJSON(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	body := []byte(`{"text":"{invalid-json","path":"tag/tag.json"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/save_text", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer test-token")
	rec := httptest.NewRecorder()

	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want status 400, got %d", rec.Code)
	}
}

// 目的: get_hidden_achievementの必須パラメータ検証を確認する。副作用: なし。前提: 互換モードではLocalErrorレスポンスを返す。
func TestGetHiddenAchievement_MissingParam_ReturnsLocalError(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	req := httptest.NewRequest(http.MethodGet, "/api/get_hidden_achievement", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rec := httptest.NewRecorder()

	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("want status 200, got %d", rec.Code)
	}

	var localErr LocalError
	if err := json.Unmarshal(rec.Body.Bytes(), &localErr); err != nil {
		t.Fatalf("failed to unmarshal local error: %v", err)
	}
	if localErr.Key == "" {
		t.Fatalf("want local error key, got empty")
	}
}

// 目的: get_hidden_achievementの返却データが旧編集データ互換の主要フィールドを含むことを検証する。副作用: テスト用HTTPサーバを起動する。前提: 抽出に必要なHTML要素が存在する。
func TestFetchHiddenAchievement_ContainsLegacyCompatibleFields(t *testing.T) {
	mockHTML := `
<html>
	<body>
		<div class="db-view__achievement__text__name">テスト実績</div>
		<div class="db-view__achievement__help">説明文</div>
		<img class="db-view__achievement__icon__image" src="https://img.finalfantasyxiv.com/lds/pc/global/images/itemicon/12/1234567890abcdef1234567890abcdef12345678.png?n5" />
		<div class="db-view__achievement__point">10</div>
		<div class="latest_patch__major__icon"></div>
	</body>
</html>`
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(mockHTML))
	}))
	defer mockServer.Close()

	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	result, err := server.fetchHiddenAchievement(context.Background(), mockServer.URL, "battle", "quests")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}

	encoded, err := json.Marshal(result)
	if err != nil {
		t.Fatalf("failed to marshal result: %v", err)
	}
	var payload map[string]any
	if err := json.Unmarshal(encoded, &payload); err != nil {
		t.Fatalf("failed to unmarshal result: %v", err)
	}

	if _, exists := payload["iconPath"]; !exists {
		t.Fatalf("want iconPath in response payload")
	}
	if payload["isCreated"] != true {
		t.Fatalf("want isCreated true, got %v", payload["isCreated"])
	}
	if payload["isEdited"] != true {
		t.Fatalf("want isEdited true, got %v", payload["isEdited"])
	}
	if payload["isNowCreated"] != true {
		t.Fatalf("want isNowCreated true, got %v", payload["isNowCreated"])
	}
	if payload["sourceIndex"] != float64(-1) {
		t.Fatalf("want sourceIndex -1, got %v", payload["sourceIndex"])
	}
}

// 目的: save_textで権限不足エラー時に403を返すことを検証する。副作用: なし。前提: ストレージが権限不足エラーを返す。
func TestSaveText_PermissionDenied(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{err: apperrors.ErrPermissionDenied})

	body := []byte(`{"text":"{}","path":"tag/tag.json"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/save_text", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer test-token")
	rec := httptest.NewRecorder()

	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("want status 403, got %d", rec.Code)
	}
}

// 目的: save_textのレート制限超過時に429を返すことを検証する。副作用: なし。前提: save_textの1分当たり上限が1に設定される。
func TestSaveText_RateLimitExceeded(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation:  true,
		ErrorMode:             ErrorModeCompat,
		SaveTextRatePerMinute: 1,
		GetRatePerMinute:      60,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	body := []byte(`{"text":"{}","path":"tag/tag.json"}`)
	firstReq := httptest.NewRequest(http.MethodPost, "/api/save_text", bytes.NewReader(body))
	firstReq.Header.Set("Authorization", "Bearer test-token")
	firstRec := httptest.NewRecorder()
	server.Handler().ServeHTTP(firstRec, firstReq)

	secondReq := httptest.NewRequest(http.MethodPost, "/api/save_text", bytes.NewReader(body))
	secondReq.Header.Set("Authorization", "Bearer test-token")
	secondRec := httptest.NewRecorder()
	server.Handler().ServeHTTP(secondRec, secondReq)

	if secondRec.Code != http.StatusTooManyRequests {
		t.Fatalf("want status 429, got %d", secondRec.Code)
	}
}

// 目的: fetchItemInfoで画像を保存することを検証する。副作用: テスト用HTTPサーバを起動する。前提: HTMLにアイテム名と画像URLが含まれる。
func TestFetchItemInfo_SavesImageBinary(t *testing.T) {
	imageServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write([]byte("png-binary"))
	}))
	defer imageServer.Close()

	itemServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(`
<html>
	<body>
		<div class="db-view__item__text__name">テストアイテム</div>
		<img class="db-view__item__icon__item_image" src="` + imageServer.URL + `/icon.png" />
	</body>
</html>`))
	}))
	defer itemServer.Close()

	storage := &stubStorage{}
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, storage)

	fetchedItem, err := server.fetchItemInfo(context.Background(), itemServer.URL, "battle", "quests")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if fetchedItem.ItemAwardImagePath == "" {
		t.Fatalf("want itemAwardImagePath, got empty")
	}
	if storage.savedBinaryPath != fetchedItem.ItemAwardImagePath {
		t.Fatalf("want saved binary path %s, got %s", fetchedItem.ItemAwardImagePath, storage.savedBinaryPath)
	}
	if storage.savedBinaryContentType != "image/png" {
		t.Fatalf("want content type image/png, got %s", storage.savedBinaryContentType)
	}
}

// 目的: get_icon_imgで画像を保存し返却パスを返すことを検証する。副作用: テスト用HTTPサーバを起動し正規表現設定を一時変更する。前提: iconRegexpがテスト終了時に復元される。
func TestGetIconImg_SavesBinaryAndReturnsPath(t *testing.T) {
	imageServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write([]byte("icon-png"))
	}))
	defer imageServer.Close()

	originalIconRegexp := iconRegexp
	iconRegexp = regexp.MustCompile(`^` + regexp.QuoteMeta(imageServer.URL) + `/icon\.png$`)
	defer func() {
		iconRegexp = originalIconRegexp
	}()

	storage := &stubStorage{}
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, storage)

	iconURL := imageServer.URL + "/icon.png"
	requestURL := "/api/get_icon_img?url=" + url.QueryEscape(iconURL) + "&category=battle&group=quests"
	req := httptest.NewRequest(http.MethodGet, requestURL, nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("want status 200, got %d", rec.Code)
	}

	var iconPath string
	if err := json.Unmarshal(rec.Body.Bytes(), &iconPath); err != nil {
		t.Fatalf("failed to unmarshal icon path: %v", err)
	}
	if iconPath == "" {
		t.Fatalf("want icon path, got empty")
	}
	if storage.savedBinaryPath != iconPath {
		t.Fatalf("want saved path %s, got %s", iconPath, storage.savedBinaryPath)
	}
	if storage.savedBinaryContentType != "image/png" {
		t.Fatalf("want image/png, got %s", storage.savedBinaryContentType)
	}
}

// 目的: get系APIで互換モード時にレート超過をLocalErrorで返すことを検証する。副作用: なし。前提: get系の1分当たり上限が1に設定される。
func TestGetAPI_RateLimitExceeded_ReturnsLocalErrorOnCompat(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation:  true,
		ErrorMode:             ErrorModeCompat,
		SaveTextRatePerMinute: 20,
		GetRatePerMinute:      1,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	firstReq := httptest.NewRequest(http.MethodGet, "/api/get_hidden_achievement", nil)
	firstReq.Header.Set("Authorization", "Bearer test-token")
	firstRec := httptest.NewRecorder()
	server.Handler().ServeHTTP(firstRec, firstReq)

	secondReq := httptest.NewRequest(http.MethodGet, "/api/get_hidden_achievement", nil)
	secondReq.Header.Set("Authorization", "Bearer test-token")
	secondRec := httptest.NewRecorder()
	server.Handler().ServeHTTP(secondRec, secondReq)

	if secondRec.Code != http.StatusOK {
		t.Fatalf("want status 200, got %d", secondRec.Code)
	}
	var localErr LocalError
	if err := json.Unmarshal(secondRec.Body.Bytes(), &localErr); err != nil {
		t.Fatalf("failed to unmarshal local error: %v", err)
	}
	if localErr.Key != "rate_limit_exceeded" {
		t.Fatalf("want rate_limit_exceeded, got %s", localErr.Key)
	}
}

// 目的: get_character_infoが認証なしで呼び出せ、旧互換レスポンス形を返すことを検証する。副作用: テスト用HTTPサーバと正規表現設定を一時変更する。前提: profile URL正規表現はテスト終了時に復元される。
func TestGetCharacterInfo_PublicEndpointWithoutAuth(t *testing.T) {
	mockHTML := `
<html>
	<body>
		<div class="frame__chara__name">Test Taro</div>
		<div class="frame__chara__world">Aegis (Elemental)</div>
		<div class="character-block">
			<div class="character-block__name">ヒューラン<br>ミッドランダー / ♂</div>
		</div>
		<div class="character-block__birth">星6月(6月) 17日</div>
		<div class="character__selfintroduction">hello world</div>
	</body>
</html>`
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(mockHTML))
	}))
	defer mockServer.Close()
	targetProfileURL := mockServer.URL + "/lodestone/character/12345"

	originalProfileRegexp := characterProfileRegexp
	characterProfileRegexp = regexp.MustCompile(`^` + regexp.QuoteMeta(mockServer.URL) + `/lodestone/character/([0-9]+)$`)
	defer func() {
		characterProfileRegexp = originalProfileRegexp
	}()

	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	requestURL := "/api/get_character_info?url=" + url.QueryEscape(targetProfileURL)
	req := httptest.NewRequest(http.MethodGet, requestURL, nil)
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("want status 200, got %d", rec.Code)
	}
	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to unmarshal payload: %v", err)
	}
	if payload["characterID"] == nil {
		t.Fatalf("want characterID, got nil")
	}
	characterData, ok := payload["characterData"].(map[string]any)
	if !ok {
		t.Fatalf("want characterData object")
	}
	if characterData["firstName"] != "Test" {
		t.Fatalf("want firstName=Test, got %v", characterData["firstName"])
	}
	if characterData["lastName"] != "Taro" {
		t.Fatalf("want lastName=Taro, got %v", characterData["lastName"])
	}
}

// 目的: get_character_infoのURL必須バリデーションを検証する。副作用: なし。前提: query未指定で呼び出す。
func TestGetCharacterInfo_MissingURL(t *testing.T) {
	server := NewServer(Config{
		StrictJSONValidation: true,
		ErrorMode:            ErrorModeCompat,
	}, stubAuth{uid: "test-user"}, &stubStorage{})

	req := httptest.NewRequest(http.MethodGet, "/api/get_character_info", nil)
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want status 400, got %d", rec.Code)
	}
}
