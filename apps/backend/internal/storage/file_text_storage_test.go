package storage

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

// 目的: SaveTextがディレクトリを自動作成して保存できることを検証する。副作用: 一時ディレクトリ配下へファイルを書き込む。前提: relativePathは相対パスである。
func TestFileTextStorage_SaveText_CreatesDirectoriesAndWritesFile(t *testing.T) {
	tempDir := t.TempDir()
	fileStorage, err := NewFileTextStorage(tempDir)
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}

	targetPath := "editedAchievementData/battle/dungeon.json"
	content := []byte(`{"ok":true}`)
	if err := fileStorage.SaveText(context.Background(), targetPath, content); err != nil {
		t.Fatalf("want no error, got %v", err)
	}

	savedPath := filepath.Join(tempDir, targetPath)
	savedBody, err := os.ReadFile(savedPath)
	if err != nil {
		t.Fatalf("failed to read saved file: %v", err)
	}
	if string(savedBody) != string(content) {
		t.Fatalf("want %s, got %s", string(content), string(savedBody))
	}
}

// 目的: SaveTextがディレクトリトラバーサルを拒否することを検証する。副作用: なし。前提: relativePathに上位参照が含まれる。
func TestFileTextStorage_SaveText_RejectsPathTraversal(t *testing.T) {
	tempDir := t.TempDir()
	fileStorage, err := NewFileTextStorage(tempDir)
	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}

	if err := fileStorage.SaveText(context.Background(), "../outside.json", []byte("x")); err == nil {
		t.Fatalf("want error, got nil")
	}
}
