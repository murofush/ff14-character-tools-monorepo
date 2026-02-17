import { type CharacterSessionResponse } from '../select-achievement/model/types'

type LocalErrorResponse = {
  key: string
  value: string
}

type Fetcher = (input: string) => Promise<Response>

export type FetchCharacterInfoResult =
  | {
      ok: true
      value: CharacterSessionResponse
    }
  | {
      ok: false
      message: string
    }

type FetchCharacterInfoOptions = {
  backendBaseUrl?: string
  fetcher?: Fetcher
}

/** 目的: backendの`/api/get_character_info`を呼び出し、最低限必要なキャラクター識別子を返す。副作用: HTTP通信を実行する。前提: `profileUrl` はLodestoneキャラクターページURLである。 */
export async function fetchCharacterInfoFromBackend(
  profileUrl: string,
  options: FetchCharacterInfoOptions = {}
): Promise<FetchCharacterInfoResult> {
  const fetcher: Fetcher = options.fetcher ?? ((input: string) => fetch(input))
  const endpoint = buildGetCharacterInfoEndpoint(profileUrl, options.backendBaseUrl)

  try {
    const response = await fetcher(endpoint)
    const payload = (await response.json()) as unknown

    if (!response.ok) {
      const localError = parseLocalError(payload)
      if (localError) {
        return {
          ok: false,
          message: localError.value,
        }
      }
      return {
        ok: false,
        message: 'キャラクター情報の取得に失敗しました。',
      }
    }

    const parsedResponse = parseGetCharacterInfoResponse(payload)
    if (!parsedResponse) {
      return {
        ok: false,
        message: 'キャラクター情報の形式が不正です。',
      }
    }

    return {
      ok: true,
      value: parsedResponse,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      message: `キャラクター情報の取得に失敗しました: ${reason}`,
    }
  }
}

/** 目的: backendBaseUrl と profileUrl から `get_character_info` の完全URLを生成する。副作用: なし。前提: `profileUrl` はURL文字列である。 */
function buildGetCharacterInfoEndpoint(
  profileUrl: string,
  backendBaseUrl: string | undefined
): string {
  const normalizedBaseUrl = (backendBaseUrl ?? '').trim().replace(/\/$/, '')
  const basePath = normalizedBaseUrl === '' ? '' : normalizedBaseUrl
  return `${basePath}/api/get_character_info?url=${encodeURIComponent(profileUrl)}`
}

/** 目的: backendのLocalError互換レスポンスを判定して返す。副作用: なし。前提: `payload` はJSONパース済みのunknownである。 */
function parseLocalError(payload: unknown): LocalErrorResponse | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const candidate = payload as Record<string, unknown>
  if (typeof candidate.key !== 'string' || typeof candidate.value !== 'string') {
    return null
  }
  return {
    key: candidate.key,
    value: candidate.value,
  }
}

/** 目的: unknown値がRecord型か判定する。副作用: なし。前提: JSONパース済みデータを受け取る。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** 目的: 完了実績1件のレスポンス構造を検証する。副作用: なし。前提: completedDateはISO文字列を受け取る。 */
function isCompletedAchievement(value: unknown): value is { title: string; completedDate: string } {
  return isRecord(value) && typeof value.title === 'string' && typeof value.completedDate === 'string'
}

/** 目的: kind単位完了実績のレスポンス構造を検証する。副作用: なし。前提: achievements は配列である。 */
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

/** 目的: `get_character_info` 成功レスポンスの旧互換構造を検証する。副作用: なし。前提: `payload` はJSONパース済みのunknownである。 */
function parseGetCharacterInfoResponse(payload: unknown): CharacterSessionResponse | null {
  if (!isRecord(payload)) {
    return null
  }
  const candidate = payload
  if (typeof candidate.characterID !== 'number') {
    return null
  }
  if (typeof candidate.fetchedDate !== 'string') {
    return null
  }
  if (!isRecord(candidate.characterData)) {
    return null
  }
  if (
    !Array.isArray(candidate.completedAchievementsKinds) ||
    !candidate.completedAchievementsKinds.every((kind) => isCompletedAchievementsKind(kind))
  ) {
    return null
  }
  if (typeof candidate.isAchievementPrivate !== 'boolean') {
    return null
  }

  const parsedResponse: CharacterSessionResponse = {
    characterID: candidate.characterID,
    fetchedDate: candidate.fetchedDate,
    characterData: candidate.characterData,
    completedAchievementsKinds: candidate.completedAchievementsKinds,
    isAchievementPrivate: candidate.isAchievementPrivate,
  }
  if (isRecord(candidate.freecompanyInfo)) {
    parsedResponse.freecompanyInfo = candidate.freecompanyInfo
  }

  return parsedResponse
}
