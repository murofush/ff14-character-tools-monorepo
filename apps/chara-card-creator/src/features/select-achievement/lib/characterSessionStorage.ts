import { type AchievementIndexPath, type CharacterSessionResponse } from '../model/types'

const CHARACTER_SESSION_STORAGE_KEY = 'ff14.chara_card.character_session'
const SELECTED_ACHIEVEMENT_STORAGE_KEY = 'ff14.chara_card.selected_achievement_paths'

/** 目的: unknown値がRecord型か判定する。副作用: なし。前提: JSON.parse結果を受け取る。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** 目的: 完了実績1件の最小構造を検証する。副作用: なし。前提: completedDateはISO文字列として扱う。 */
function isCompletedAchievement(value: unknown): value is { title: string; completedDate: string } {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.completedDate === 'string'
  )
}

/** 目的: `get_character_info` の完了実績kind構造を検証する。副作用: なし。前提: achievements配列の要素はisCompletedAchievementで判定する。 */
function isCompletedAchievementsKind(
  value: unknown
): value is { key: string; achievements: { title: string; completedDate: string }[] } {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    Array.isArray(value.achievements) &&
    value.achievements.every((achievement) => isCompletedAchievement(achievement))
  )
}

/** 目的: CharacterSessionResponse最小構造を検証する。副作用: なし。前提: characterDataは任意オブジェクトを許容する。 */
export function isCharacterSessionResponse(value: unknown): value is CharacterSessionResponse {
  if (!isRecord(value)) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.characterID === 'number' &&
    typeof candidate.fetchedDate === 'string' &&
    isRecord(candidate.characterData) &&
    Array.isArray(candidate.completedAchievementsKinds) &&
    candidate.completedAchievementsKinds.every((kind) => isCompletedAchievementsKind(kind)) &&
    typeof candidate.isAchievementPrivate === 'boolean' &&
    (candidate.freecompanyInfo === undefined || isRecord(candidate.freecompanyInfo))
  )
}

/** 目的: localStorageからキャラクターセッションを読み出す。副作用: 不正データ検出時に該当keyを削除する。前提: ブラウザ環境で実行する。 */
export function readCharacterSessionResponse(): CharacterSessionResponse | null {
  if (typeof window === 'undefined') {
    return null
  }
  const rawText = window.localStorage.getItem(CHARACTER_SESSION_STORAGE_KEY)
  if (!rawText) {
    return null
  }
  try {
    const parsed = JSON.parse(rawText) as unknown
    if (!isCharacterSessionResponse(parsed)) {
      window.localStorage.removeItem(CHARACTER_SESSION_STORAGE_KEY)
      return null
    }
    return parsed
  } catch (_error) {
    window.localStorage.removeItem(CHARACTER_SESSION_STORAGE_KEY)
    return null
  }
}

/** 目的: キャラクターセッションをlocalStorageへ保存する。副作用: localStorage書き込みを行う。前提: ブラウザ環境で実行する。 */
export function writeCharacterSessionResponse(response: CharacterSessionResponse): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(CHARACTER_SESSION_STORAGE_KEY, JSON.stringify(response))
}

/** 目的: キャラクターセッションをlocalStorageから削除する。副作用: localStorage削除を行う。前提: ブラウザ環境で実行する。 */
export function clearCharacterSessionResponse(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(CHARACTER_SESSION_STORAGE_KEY)
}

/** 目的: selected achievement path構造を検証する。副作用: なし。前提: 数値index4要素を持つ。 */
function isAchievementIndexPath(value: unknown): value is AchievementIndexPath {
  return (
    isRecord(value) &&
    typeof value.kindIndex === 'number' &&
    typeof value.categoryIndex === 'number' &&
    typeof value.groupIndex === 'number' &&
    typeof value.achievementIndex === 'number'
  )
}

/** 目的: 選択済みアチーブメントindex配列を読み出す。副作用: 不正データ検出時に該当keyを削除する。前提: ブラウザ環境で実行する。 */
export function readSelectedAchievementPaths(): AchievementIndexPath[] {
  if (typeof window === 'undefined') {
    return []
  }
  const rawText = window.localStorage.getItem(SELECTED_ACHIEVEMENT_STORAGE_KEY)
  if (!rawText) {
    return []
  }
  try {
    const parsed = JSON.parse(rawText) as unknown
    if (!Array.isArray(parsed) || !parsed.every((item) => isAchievementIndexPath(item))) {
      window.localStorage.removeItem(SELECTED_ACHIEVEMENT_STORAGE_KEY)
      return []
    }
    return parsed
  } catch (_error) {
    window.localStorage.removeItem(SELECTED_ACHIEVEMENT_STORAGE_KEY)
    return []
  }
}

/** 目的: 選択済みアチーブメントindex配列を保存する。副作用: localStorage書き込みを行う。前提: ブラウザ環境で実行する。 */
export function writeSelectedAchievementPaths(paths: AchievementIndexPath[]): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(SELECTED_ACHIEVEMENT_STORAGE_KEY, JSON.stringify(paths))
}

/** 目的: 選択済みアチーブメントindex配列を削除する。副作用: localStorage削除を行う。前提: ブラウザ環境で実行する。 */
export function clearSelectedAchievementPaths(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(SELECTED_ACHIEVEMENT_STORAGE_KEY)
}
