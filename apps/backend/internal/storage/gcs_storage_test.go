package storage

import (
	"context"
	"errors"
	"testing"

	"github.com/ff14/achievement-backend/internal/apperrors"
	"google.golang.org/api/googleapi"
)

type stubObjectUploader struct {
	savedPath        string
	savedBody        []byte
	savedContentType string
	err              error
}

// 目的: テスト用アップロード処理を差し替える。副作用: 保存結果を内部状態へ記録する。前提: objectPathは空でない。
func (s *stubObjectUploader) UploadObject(_ context.Context, objectPath string, body []byte, contentType string) error {
	s.savedPath = objectPath
	s.savedBody = body
	s.savedContentType = contentType
	return s.err
}

// 目的: SaveTextがprefix付きパスで保存されることを検証する。副作用: なし。前提: uploaderが正常に保存できる。
func TestGCSStorage_SaveText_WithPrefix(t *testing.T) {
	uploader := &stubObjectUploader{}
	storage := newGCSStorageForTest(uploader, "forfan-resource")

	err := storage.SaveText(context.Background(), "tag/tag.json", []byte("{}"))
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if uploader.savedPath != "forfan-resource/tag/tag.json" {
		t.Fatalf("want prefixed object path, got %s", uploader.savedPath)
	}
	if uploader.savedContentType != "application/json; charset=utf-8" {
		t.Fatalf("want json content type, got %s", uploader.savedContentType)
	}
}

// 目的: SaveBinaryがコンテントタイプ未指定時にデフォルト値を使うことを検証する。副作用: なし。前提: uploaderが正常に保存できる。
func TestGCSStorage_SaveBinary_DefaultContentType(t *testing.T) {
	uploader := &stubObjectUploader{}
	storage := newGCSStorageForTest(uploader, "")

	err := storage.SaveBinary(context.Background(), "achievementData/img/a.png", []byte("png"), "")
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if uploader.savedContentType != "application/octet-stream" {
		t.Fatalf("want default content type, got %s", uploader.savedContentType)
	}
}

// 目的: 権限不足エラーが共通ErrPermissionDeniedへ正規化されることを検証する。副作用: なし。前提: uploaderが403エラーを返す。
func TestGCSStorage_SaveText_PermissionDenied(t *testing.T) {
	uploader := &stubObjectUploader{
		err: &googleapi.Error{
			Code:    403,
			Message: "permission denied",
		},
	}
	storage := newGCSStorageForTest(uploader, "")

	err := storage.SaveText(context.Background(), "tag/tag.json", []byte("{}"))
	if !errors.Is(err, apperrors.ErrPermissionDenied) {
		t.Fatalf("want ErrPermissionDenied, got %v", err)
	}
}
