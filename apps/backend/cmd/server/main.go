package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/ff14/achievement-backend/internal/api"
	"github.com/ff14/achievement-backend/internal/auth"
	"github.com/ff14/achievement-backend/internal/storage"
)

// 目的: サーバ起動に必要な環境変数を読み込みHTTPサーバを開始する。副作用: ネットワーク待受とログ出力を行う。前提: 認証方式と保存方式の必須環境変数が設定可能である。
func main() {
	ctx := context.Background()
	port := getEnv("PORT", "8080")
	errorMode := parseErrorMode(getEnv("API_ERROR_MODE", string(api.ErrorModeCompat)))
	strictJSONValidation := parseBool(getEnv("ENABLE_STRICT_JSON_VALIDATION", "false"))
	requestTimeout := time.Duration(parseInt(getEnv("LODSTONE_REQUEST_TIMEOUT_MS", "15000"), 15000)) * time.Millisecond
	adminFrontOrigin := strings.TrimSpace(os.Getenv("ADMIN_FRONT_ORIGIN"))
	saveTextRatePerMinute := parseInt(getEnv("SAVE_TEXT_RATE_LIMIT_PER_MINUTE", "20"), 20)
	getRatePerMinute := parseInt(getEnv("GET_RATE_LIMIT_PER_MINUTE", "60"), 60)

	tokenValidator, err := buildTokenValidator(ctx)
	if err != nil {
		log.Fatalf("failed to initialize token validator: %v", err)
	}
	textStorage, err := buildTextStorage(ctx)
	if err != nil {
		log.Fatalf("failed to initialize text storage: %v", err)
	}

	server := api.NewServer(api.Config{
		StrictJSONValidation:  strictJSONValidation,
		ErrorMode:             errorMode,
		RequestTimeout:        requestTimeout,
		SaveTextRatePerMinute: saveTextRatePerMinute,
		GetRatePerMinute:      getRatePerMinute,
	}, tokenValidator, textStorage)

	handler := withCORS(server.Handler(), adminFrontOrigin)
	log.Printf(
		"backend server is starting on :%s (errorMode=%s, strictJSON=%t, saveRate=%d, getRate=%d)",
		port,
		errorMode,
		strictJSONValidation,
		saveTextRatePerMinute,
		getRatePerMinute,
	)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

// 目的: 環境変数に応じたトークン検証器を生成する。副作用: 認証クライアントを初期化する。前提: AUTH_BACKENDが`static`または`firebase`である。
func buildTokenValidator(ctx context.Context) (api.TokenValidator, error) {
	authBackend := strings.ToLower(getEnv("AUTH_BACKEND", "static"))
	switch authBackend {
	case "static":
		staticToken := getEnv("STATIC_BEARER_TOKEN", "local-dev-token")
		staticUID := getEnv("STATIC_OPERATOR_UID", "local-operator")
		return auth.NewStaticTokenValidator(staticToken, staticUID)
	case "firebase":
		projectID := getEnv("FIREBASE_PROJECT_ID", "")
		return auth.NewFirebaseTokenValidator(ctx, projectID)
	default:
		return nil, errors.New("unsupported AUTH_BACKEND: " + authBackend)
	}
}

// 目的: 環境変数に応じた保存ストレージを生成する。副作用: ストレージクライアントを初期化する。前提: STORAGE_BACKENDが`local`または`gcs`である。
func buildTextStorage(ctx context.Context) (api.TextStorage, error) {
	storageBackend := strings.ToLower(getEnv("STORAGE_BACKEND", "local"))
	switch storageBackend {
	case "local":
		saveRootDir := getEnv("BACKEND_SAVE_ROOT", "./local-storage/forfan-resource")
		return storage.NewFileTextStorage(saveRootDir)
	case "gcs":
		bucketName := getEnv("FORFAN_RESOURCES_BUCKET", "forfan-resource")
		objectPrefix := getEnv("FORFAN_RESOURCES_PREFIX", "")
		return storage.NewGCSStorage(ctx, bucketName, objectPrefix)
	default:
		return nil, errors.New("unsupported STORAGE_BACKEND: " + storageBackend)
	}
}

// 目的: CORSレスポンスヘッダを付与しOPTIONSプリフライトを処理する。副作用: HTTPヘッダ書き込みを行う。前提: originが空の場合はCORS制限を行わない。
func withCORS(next http.Handler, origin string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.TrimSpace(origin) != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization,Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// 目的: 環境変数を取得し未設定時にデフォルト値を返す。副作用: なし。前提: keyは有効な環境変数名である。
func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

// 目的: 真偽値文字列をboolへ変換する。副作用: なし。前提: valueはtrue/false系の文字列である。
func parseBool(value string) bool {
	lowerValue := strings.ToLower(strings.TrimSpace(value))
	return lowerValue == "1" || lowerValue == "true" || lowerValue == "yes" || lowerValue == "on"
}

// 目的: 文字列数値をintへ変換し失敗時にデフォルト値を返す。副作用: なし。前提: valueは整数表現である可能性がある。
func parseInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	return parsed
}

// 目的: エラーモード文字列を列挙値へ変換する。副作用: なし。前提: valueはcompatまたはhttpを想定する。
func parseErrorMode(value string) api.ErrorMode {
	if strings.EqualFold(strings.TrimSpace(value), string(api.ErrorModeHTTP)) {
		return api.ErrorModeHTTP
	}
	return api.ErrorModeCompat
}
