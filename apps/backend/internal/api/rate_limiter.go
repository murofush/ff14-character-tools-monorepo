package api

import (
	"strings"
	"sync"
	"time"
)

type RateLimiter interface {
	Allow(uid string, path string) bool
}

type rateLimitCounter struct {
	windowStart time.Time
	count       int
}

type InMemoryRateLimiter struct {
	saveTextLimitPerMinute int
	getLimitPerMinute      int
	mutex                  sync.Mutex
	counters               map[string]rateLimitCounter
}

// 目的: エンドポイント別の1分単位レート制限器を生成する。副作用: 内部状態マップを初期化する。前提: limitが0以下の場合は無制限として扱う。
func NewInMemoryRateLimiter(saveTextLimitPerMinute int, getLimitPerMinute int) *InMemoryRateLimiter {
	return &InMemoryRateLimiter{
		saveTextLimitPerMinute: saveTextLimitPerMinute,
		getLimitPerMinute:      getLimitPerMinute,
		counters:               map[string]rateLimitCounter{},
	}
}

// 目的: 指定ユーザーがエンドポイントへアクセス可能か判定する。副作用: カウントを更新する。前提: uidは認証済みユーザーを示す識別子である。
func (l *InMemoryRateLimiter) Allow(uid string, path string) bool {
	limit := l.resolveLimit(path)
	if limit <= 0 {
		return true
	}

	nowWindow := time.Now().UTC().Truncate(time.Minute)
	key := uid + ":" + path

	l.mutex.Lock()
	defer l.mutex.Unlock()

	counter, exists := l.counters[key]
	if !exists || !counter.windowStart.Equal(nowWindow) {
		l.counters[key] = rateLimitCounter{
			windowStart: nowWindow,
			count:       1,
		}
		return true
	}
	if counter.count >= limit {
		return false
	}
	counter.count++
	l.counters[key] = counter
	return true
}

// 目的: パスに応じたレート制限上限を返す。副作用: なし。前提: pathは`/api/*`形式を想定する。
func (l *InMemoryRateLimiter) resolveLimit(path string) int {
	if path == "/api/save_text" {
		return l.saveTextLimitPerMinute
	}
	if strings.HasPrefix(path, "/api/get_") {
		return l.getLimitPerMinute
	}
	return 0
}
