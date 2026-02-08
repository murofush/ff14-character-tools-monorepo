package storage

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

type FileTextStorage struct {
	baseDir string
}

// 目的: ローカルファイル保存用ストレージを生成する。副作用: 保存先ディレクトリを作成する。前提: baseDirは空文字ではない。
func NewFileTextStorage(baseDir string) (*FileTextStorage, error) {
	if strings.TrimSpace(baseDir) == "" {
		return nil, errors.New("baseDir is required")
	}
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return nil, err
	}
	absBaseDir, err := filepath.Abs(baseDir)
	if err != nil {
		return nil, err
	}
	return &FileTextStorage{baseDir: absBaseDir}, nil
}

// 目的: 相対パス配下へテキストを保存する。副作用: ディレクトリ作成とファイル上書きを行う。前提: relativePathはbaseDir配下を指す相対パスである。
func (s *FileTextStorage) SaveText(ctx context.Context, relativePath string, body []byte) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	if strings.TrimSpace(relativePath) == "" {
		return errors.New("relativePath is required")
	}

	cleanRelativePath := filepath.Clean(relativePath)
	targetPath := filepath.Join(s.baseDir, cleanRelativePath)
	absTargetPath, err := filepath.Abs(targetPath)
	if err != nil {
		return err
	}
	rel, err := filepath.Rel(s.baseDir, absTargetPath)
	if err != nil {
		return err
	}
	if strings.HasPrefix(rel, "..") || rel == "." && cleanRelativePath == "." {
		return errors.New("relativePath must stay inside baseDir")
	}

	if err := os.MkdirAll(filepath.Dir(absTargetPath), 0o755); err != nil {
		return err
	}
	return os.WriteFile(absTargetPath, body, 0o644)
}
