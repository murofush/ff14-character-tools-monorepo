import type { NormalizedLodestoneInput } from './lodestoneInput'

const RECENT_CHARACTER_STORAGE_KEY = 'chara-card-creator:recent-character-v1'

export interface RecentCharacterSummary extends NormalizedLodestoneInput {
  fetchedAt: string
}

/**
 * 目的: Home画面で表示する最新入力キャラクター情報をブラウザ保存から復元する。
 * 副作用: なし（localStorageの読み取りのみ）。
 * 前提: ブラウザ環境で実行され、保存形式はJSON文字列である。
 */
export function readRecentCharacterSummary(): RecentCharacterSummary | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(RECENT_CHARACTER_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecentCharacterSummary(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * 目的: 入力済みキャラクターを最新1件として保存し、再訪時の導線を維持する。
 * 副作用: localStorageを書き換える。
 * 前提: `summary` は `normalizeLodestoneInput` 成功結果に `fetchedAt` を付与した値である。
 */
export function writeRecentCharacterSummary(summary: RecentCharacterSummary): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    RECENT_CHARACTER_STORAGE_KEY,
    JSON.stringify(summary)
  )
}

/**
 * 目的: 永続化データの型破損を検出し、Home画面での表示崩れを防ぐ。
 * 副作用: なし（純関数）。
 * 前提: `value` はJSON.parseの戻り値（unknown）である。
 */
function isRecentCharacterSummary(value: unknown): value is RecentCharacterSummary {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.characterId === 'string' &&
    typeof candidate.profileUrl === 'string' &&
    typeof candidate.fetchedAt === 'string'
  )
}
