package apperrors

import "errors"

var (
	// 目的: 認可または保存権限不足を示す共通エラーを表す。副作用: なし。前提: errors.Isで判定される。
	ErrPermissionDenied = errors.New("permission denied")
)
