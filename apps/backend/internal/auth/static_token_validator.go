package auth

import (
	"context"
	"errors"
)

type StaticTokenValidator struct {
	expectedToken string
	uid           string
}

// 目的: 開発用の固定トークン検証器を生成する。副作用: なし。前提: expectedTokenは空文字ではない。
func NewStaticTokenValidator(expectedToken string, uid string) (*StaticTokenValidator, error) {
	if expectedToken == "" {
		return nil, errors.New("expected token is required")
	}
	resolvedUID := uid
	if resolvedUID == "" {
		resolvedUID = "local-operator"
	}
	return &StaticTokenValidator{
		expectedToken: expectedToken,
		uid:           resolvedUID,
	}, nil
}

// 目的: Bearerトークンの一致確認を行う。副作用: なし。前提: tokenにAuthorizationヘッダ由来の値が渡される。
func (v *StaticTokenValidator) ValidateToken(_ context.Context, token string) (string, error) {
	if token != v.expectedToken {
		return "", errors.New("invalid token")
	}
	return v.uid, nil
}
