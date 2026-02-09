package auth

import (
	"context"
	"errors"
	"strings"

	firebase "firebase.google.com/go/v4"
	firebaseauth "firebase.google.com/go/v4/auth"
)

type firebaseAuthClient interface {
	VerifyIDToken(ctx context.Context, idToken string) (*firebaseauth.Token, error)
}

type FirebaseTokenValidator struct {
	client firebaseAuthClient
}

// 目的: Firebase Admin SDKを使ったIDトークン検証器を生成する。副作用: Firebaseクライアントを初期化する。前提: projectIDは空文字ではない。
func NewFirebaseTokenValidator(ctx context.Context, projectID string) (*FirebaseTokenValidator, error) {
	trimmedProjectID := strings.TrimSpace(projectID)
	if trimmedProjectID == "" {
		return nil, errors.New("projectID is required")
	}
	app, err := firebase.NewApp(ctx, &firebase.Config{
		ProjectID: trimmedProjectID,
	})
	if err != nil {
		return nil, err
	}
	client, err := app.Auth(ctx)
	if err != nil {
		return nil, err
	}
	return newFirebaseTokenValidatorWithClient(client)
}

// 目的: テスト用にFirebaseクライアント差し替えで検証器を生成する。副作用: なし。前提: clientはnilではない。
func newFirebaseTokenValidatorWithClient(client firebaseAuthClient) (*FirebaseTokenValidator, error) {
	if client == nil {
		return nil, errors.New("firebase auth client is required")
	}
	return &FirebaseTokenValidator{client: client}, nil
}

// 目的: Firebase ID Tokenを検証しUIDを返す。副作用: Firebase認証APIへ問い合わせる。前提: tokenはBearerヘッダから渡された文字列である。
func (v *FirebaseTokenValidator) ValidateToken(ctx context.Context, token string) (string, error) {
	if strings.TrimSpace(token) == "" {
		return "", errors.New("token is required")
	}
	verifiedToken, err := v.client.VerifyIDToken(ctx, token)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(verifiedToken.UID) == "" {
		return "", errors.New("uid is empty")
	}
	return verifiedToken.UID, nil
}
