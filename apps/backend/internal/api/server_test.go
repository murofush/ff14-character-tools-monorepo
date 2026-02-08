package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
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
	savedPath string
	savedBody []byte
	err       error
}

// 目的: 保存処理のテスト差し替えを可能にする。副作用: 内部状態に保存結果を記録する。前提: pathとbodyが妥当な入力として渡される。
func (s *stubStorage) SaveText(_ context.Context, path string, body []byte) error {
	s.savedPath = path
	s.savedBody = body
	return s.err
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
