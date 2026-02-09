package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync/atomic"
	"time"
)

type contextKey string

const (
	contextKeyRequestID contextKey = "requestID"
	contextKeyActorUID  contextKey = "actorUID"
)

var requestSequence uint64

type statusRecorder struct {
	http.ResponseWriter
	status int
}

// 目的: ステータスコードを捕捉しつつレスポンスを書き込む。副作用: 内部statusを更新する。前提: statusはHTTPステータスコードである。
func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// 目的: リクエストIDを付与し構造化ログを出力するミドルウェアを提供する。副作用: ヘッダ追加とログ出力を行う。前提: nextはnilではない。
func (s *Server) withRequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := nextRequestID()
		ctx := context.WithValue(r.Context(), contextKeyRequestID, requestID)
		startedAt := time.Now().UTC()

		recorder := &statusRecorder{
			ResponseWriter: w,
			status:         http.StatusOK,
		}
		recorder.Header().Set("X-Request-Id", requestID)

		next.ServeHTTP(recorder, r.WithContext(ctx))

		durationMs := time.Since(startedAt).Milliseconds()
		logPayload := map[string]any{
			"requestId":  requestID,
			"endpoint":   r.URL.Path,
			"method":     r.Method,
			"status":     recorder.status,
			"durationMs": durationMs,
		}
		if uid := getActorUID(ctx); uid != "" {
			logPayload["actorUid"] = uid
		}
		if recorder.status >= 400 {
			logPayload["errorCode"] = statusToErrorCode(recorder.status)
		}
		encoded, err := json.Marshal(logPayload)
		if err != nil {
			log.Printf("failed to marshal request log: %v", err)
			return
		}
		log.Printf("%s", string(encoded))
	})
}

// 目的: 次の一意なリクエストIDを生成する。副作用: グローバルカウンタを増加させる。前提: なし。
func nextRequestID() string {
	sequence := atomic.AddUint64(&requestSequence, 1)
	timestamp := time.Now().UTC().Format("20060102T150405.000")
	return "req-" + timestamp + "-" + strconv.FormatUint(sequence, 10)
}

// 目的: コンテキストからリクエストIDを取り出す。副作用: なし。前提: withRequestLoggingミドルウェアを経由している。
func getRequestID(ctx context.Context) string {
	value := ctx.Value(contextKeyRequestID)
	requestID, _ := value.(string)
	return requestID
}

// 目的: コンテキストから認証済みユーザーUIDを取り出す。副作用: なし。前提: withAuthミドルウェアでUIDを設定済みである。
func getActorUID(ctx context.Context) string {
	value := ctx.Value(contextKeyActorUID)
	uid, _ := value.(string)
	return uid
}

// 目的: HTTPステータスをログ用エラーコードへ変換する。副作用: なし。前提: statusは4xx/5xxを想定する。
func statusToErrorCode(status int) string {
	switch status {
	case http.StatusUnauthorized:
		return "unauthorized"
	case http.StatusForbidden:
		return "permission_denied"
	case http.StatusBadRequest:
		return "invalid_request"
	case http.StatusTooManyRequests:
		return "rate_limit_exceeded"
	default:
		if status >= 500 {
			return "internal_error"
		}
		return "request_error"
	}
}
