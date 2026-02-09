package storage

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"cloud.google.com/go/storage"
	"github.com/ff14/achievement-backend/internal/apperrors"
	"google.golang.org/api/googleapi"
)

type objectUploader interface {
	UploadObject(ctx context.Context, objectPath string, body []byte, contentType string) error
}

type gcsBucketUploader struct {
	bucket *storage.BucketHandle
}

type GCSStorage struct {
	uploader     objectUploader
	objectPrefix string
}

// 目的: Cloud Storageへのアップローダーを生成する。副作用: なし。前提: bucketはnilではない。
func newGCSBucketUploader(bucket *storage.BucketHandle) *gcsBucketUploader {
	return &gcsBucketUploader{bucket: bucket}
}

// 目的: Cloud Storageへのオブジェクト保存を行う。副作用: GCSへ書き込みを行う。前提: objectPathは空文字でない。
func (u *gcsBucketUploader) UploadObject(ctx context.Context, objectPath string, body []byte, contentType string) error {
	writer := u.bucket.Object(objectPath).NewWriter(ctx)
	if strings.TrimSpace(contentType) != "" {
		writer.ContentType = strings.TrimSpace(contentType)
	}
	if _, err := writer.Write(body); err != nil {
		_ = writer.Close()
		return err
	}
	return writer.Close()
}

// 目的: Cloud Storage保存用ストレージを生成する。副作用: GCSクライアントを初期化する。前提: bucketNameは空文字ではない。
func NewGCSStorage(ctx context.Context, bucketName string, objectPrefix string) (*GCSStorage, error) {
	if strings.TrimSpace(bucketName) == "" {
		return nil, errors.New("bucketName is required")
	}
	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, err
	}
	bucket := client.Bucket(strings.TrimSpace(bucketName))
	return &GCSStorage{
		uploader:     newGCSBucketUploader(bucket),
		objectPrefix: strings.TrimSpace(objectPrefix),
	}, nil
}

// 目的: テスト用のアップローダー差し替えでGCSストレージを生成する。副作用: なし。前提: uploaderはnilではない。
func newGCSStorageForTest(uploader objectUploader, objectPrefix string) *GCSStorage {
	return &GCSStorage{
		uploader:     uploader,
		objectPrefix: strings.TrimSpace(objectPrefix),
	}
}

// 目的: JSONテキストをCloud Storageへ保存する。副作用: GCSへ書き込みを行う。前提: pathは相対パスである。
func (s *GCSStorage) SaveText(ctx context.Context, path string, body []byte) error {
	return s.save(ctx, path, body, "application/json; charset=utf-8")
}

// 目的: バイナリデータをCloud Storageへ保存する。副作用: GCSへ書き込みを行う。前提: pathは相対パスである。
func (s *GCSStorage) SaveBinary(ctx context.Context, path string, body []byte, contentType string) error {
	resolvedContentType := strings.TrimSpace(contentType)
	if resolvedContentType == "" {
		resolvedContentType = "application/octet-stream"
	}
	return s.save(ctx, path, body, resolvedContentType)
}

// 目的: 共通のCloud Storage保存処理を提供する。副作用: GCSへ書き込みを行う。前提: pathはオブジェクトパスへ正規化可能である。
func (s *GCSStorage) save(ctx context.Context, path string, body []byte, contentType string) error {
	if strings.TrimSpace(path) == "" {
		return errors.New("path is required")
	}
	objectPath := s.resolveObjectPath(path)
	if err := s.uploader.UploadObject(ctx, objectPath, body, contentType); err != nil {
		if isPermissionDeniedError(err) {
			return fmt.Errorf("%w: %v", apperrors.ErrPermissionDenied, err)
		}
		return err
	}
	return nil
}

// 目的: 設定済みprefixを含むオブジェクトパスを解決する。副作用: なし。前提: pathは相対パスである。
func (s *GCSStorage) resolveObjectPath(path string) string {
	cleanPath := filepath.ToSlash(filepath.Clean(path))
	cleanPath = strings.TrimPrefix(cleanPath, "/")

	cleanPrefix := strings.TrimSpace(s.objectPrefix)
	if cleanPrefix == "" {
		return cleanPath
	}
	cleanPrefix = filepath.ToSlash(filepath.Clean(cleanPrefix))
	cleanPrefix = strings.Trim(cleanPrefix, "/")
	if cleanPrefix == "" {
		return cleanPath
	}
	return cleanPrefix + "/" + cleanPath
}

// 目的: 受信したエラーが権限不足か判定する。副作用: なし。前提: errはnilでない可能性がある。
func isPermissionDeniedError(err error) bool {
	if err == nil {
		return false
	}
	var apiErr *googleapi.Error
	if errors.As(err, &apiErr) && apiErr.Code == http.StatusForbidden {
		return true
	}
	return strings.Contains(strings.ToLower(err.Error()), "permission")
}
