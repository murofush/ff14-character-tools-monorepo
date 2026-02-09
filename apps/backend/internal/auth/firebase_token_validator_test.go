package auth

import (
	"context"
	"errors"
	"testing"

	firebaseauth "firebase.google.com/go/v4/auth"
)

type stubFirebaseAuthClient struct {
	token *firebaseauth.Token
	err   error
}

// 目的: テスト用Firebase認証クライアントを差し替える。副作用: なし。前提: idTokenは空でない文字列である。
func (s *stubFirebaseAuthClient) VerifyIDToken(_ context.Context, _ string) (*firebaseauth.Token, error) {
	return s.token, s.err
}

// 目的: Firebase ID Token検証成功時にUIDを返すことを検証する。副作用: なし。前提: VerifyIDTokenがUID付きトークンを返す。
func TestFirebaseTokenValidator_ValidateToken_Success(t *testing.T) {
	validator, err := newFirebaseTokenValidatorWithClient(&stubFirebaseAuthClient{
		token: &firebaseauth.Token{
			UID: "firebase-user",
		},
	})
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	uid, err := validator.ValidateToken(context.Background(), "id-token")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if uid != "firebase-user" {
		t.Fatalf("want firebase-user, got %s", uid)
	}
}

// 目的: Firebase ID Token検証失敗時にエラーを返すことを検証する。副作用: なし。前提: VerifyIDTokenがエラーを返す。
func TestFirebaseTokenValidator_ValidateToken_VerifyError(t *testing.T) {
	validator, err := newFirebaseTokenValidatorWithClient(&stubFirebaseAuthClient{
		err: errors.New("verify failed"),
	})
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if _, err := validator.ValidateToken(context.Background(), "id-token"); err == nil {
		t.Fatalf("want error, got nil")
	}
}

// 目的: 初期化時にnilクライアントを拒否することを検証する。副作用: なし。前提: なし。
func TestFirebaseTokenValidator_New_NilClient(t *testing.T) {
	if _, err := newFirebaseTokenValidatorWithClient(nil); err == nil {
		t.Fatalf("want error, got nil")
	}
}
