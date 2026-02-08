package auth

import (
	"context"
	"testing"
)

// 目的: 固定トークン認証が一致時にUIDを返すことを検証する。副作用: なし。前提: expectedTokenが空でない。
func TestStaticTokenValidator_ValidateToken_Success(t *testing.T) {
	validator, err := NewStaticTokenValidator("expected-token", "operator-uid")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}

	uid, err := validator.ValidateToken(context.Background(), "expected-token")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if uid != "operator-uid" {
		t.Fatalf("want uid operator-uid, got %s", uid)
	}
}

// 目的: 固定トークン認証が不一致時にエラーを返すことを検証する。副作用: なし。前提: expectedTokenが空でない。
func TestStaticTokenValidator_ValidateToken_InvalidToken(t *testing.T) {
	validator, err := NewStaticTokenValidator("expected-token", "operator-uid")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}

	if _, err := validator.ValidateToken(context.Background(), "wrong-token"); err == nil {
		t.Fatalf("want error, got nil")
	}
}

// 目的: 初期化時に空トークンを拒否することを検証する。副作用: なし。前提: なし。
func TestStaticTokenValidator_New_EmptyExpectedToken(t *testing.T) {
	if _, err := NewStaticTokenValidator("", "operator-uid"); err == nil {
		t.Fatalf("want error, got nil")
	}
}
