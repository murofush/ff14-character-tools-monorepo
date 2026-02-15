import { type EditAchievementModel } from '../model/types'
import { isLocalErrorPayload, type LocalErrorPayload } from './achievementCreatorForm'
import { AuthTokenRequiredError, fetchWithAuth } from '../../auth/lib/authTokenClient'

export type FetchedItemData = {
  itemAward: string
  itemAwardUrl: string
  itemAwardImageUrl: string
  itemAwardImagePath: string
}

type ApiOptions = {
  backendBaseUrl: string
  fetcher?: typeof fetch
}

type HiddenAchievementParams = {
  url: string
  category: string
  group: string
}

type IconFetchParams = {
  url: string
  category: string
  group: string
}

type ItemFetchParams = {
  url: string
  category: string
  group: string
}

/** 目的: backend URLとAPIパスから完全URLを構築する。副作用: なし。前提: baseUrlは空文字またはhttp(s)URLである。 */
function buildApiUrl(baseUrl: string, path: string, params: URLSearchParams): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const query = params.toString()
  if (normalizedBaseUrl === '') {
    return `${path}?${query}`
  }
  return `${normalizedBaseUrl}${path}?${query}`
}

/** 目的: APIレスポンスをJSONとして安全に解釈する。副作用: なし。前提: response bodyはJSONまたは空文字である。 */
async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.trim() === '') {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

/** 目的: 認証未設定/401失効を旧LocalError互換メッセージへ変換する。副作用: なし。前提: get_* APIで利用する。 */
function mapAuthErrorToLocalError(error: unknown): LocalErrorPayload | null {
  if (error instanceof AuthTokenRequiredError) {
    return {
      key: 'auth_required',
      value: '認証情報がありません。再ログインしてください。',
    }
  }
  return null
}

/** 目的: get_hidden_achievement を呼び出して作成候補データを取得する。副作用: HTTP GET を実行する。前提: URLパラメータが有効である。 */
export async function fetchHiddenAchievement(
  params: HiddenAchievementParams,
  options: ApiOptions
): Promise<EditAchievementModel | LocalErrorPayload> {
  const fetcher = options.fetcher ?? fetch
  const url = buildApiUrl(
    options.backendBaseUrl,
    '/api/get_hidden_achievement',
    new URLSearchParams({
      url: params.url,
      category: params.category,
      group: params.group,
    })
  )
  let response: Response
  try {
    response = await fetchWithAuth(url, { method: 'GET' }, { fetcher })
  } catch (error) {
    const authError = mapAuthErrorToLocalError(error)
    if (authError) {
      return authError
    }
    throw error
  }
  const payload = await parseJsonResponse(response)
  if (response.status === 401) {
    return { key: 'auth_expired', value: '認証の有効期限が切れました。再ログインしてください。' }
  }
  if (!response.ok) {
    if (isLocalErrorPayload(payload)) {
      return payload
    }
    return { key: 'fetch_hidden_achievement_error', value: String(payload) }
  }
  if (isLocalErrorPayload(payload)) {
    return payload
  }
  return payload as EditAchievementModel
}

/** 目的: get_icon_img を呼び出してiconPathを取得する。副作用: HTTP GET を実行する。前提: URLパラメータが有効である。 */
export async function fetchIconPath(
  params: IconFetchParams,
  options: ApiOptions
): Promise<string | LocalErrorPayload> {
  const fetcher = options.fetcher ?? fetch
  const url = buildApiUrl(
    options.backendBaseUrl,
    '/api/get_icon_img',
    new URLSearchParams({
      url: params.url,
      category: params.category,
      group: params.group,
    })
  )
  let response: Response
  try {
    response = await fetchWithAuth(url, { method: 'GET' }, { fetcher })
  } catch (error) {
    const authError = mapAuthErrorToLocalError(error)
    if (authError) {
      return authError
    }
    throw error
  }
  const payload = await parseJsonResponse(response)
  if (response.status === 401) {
    return { key: 'auth_expired', value: '認証の有効期限が切れました。再ログインしてください。' }
  }
  if (!response.ok) {
    if (isLocalErrorPayload(payload)) {
      return payload
    }
    return { key: 'fetch_icon_img_error', value: String(payload) }
  }
  if (isLocalErrorPayload(payload)) {
    return payload
  }
  if (typeof payload === 'string') {
    return payload
  }
  return { key: 'fetch_icon_img_error', value: 'icon path response is invalid' }
}

/** 目的: get_item_infomation を呼び出してアイテム情報を取得する。副作用: HTTP GET を実行する。前提: URLパラメータが有効である。 */
export async function fetchItemInformation(
  params: ItemFetchParams,
  options: ApiOptions
): Promise<FetchedItemData | LocalErrorPayload> {
  const fetcher = options.fetcher ?? fetch
  const url = buildApiUrl(
    options.backendBaseUrl,
    '/api/get_item_infomation',
    new URLSearchParams({
      url: params.url,
      category: params.category,
      group: params.group,
    })
  )
  let response: Response
  try {
    response = await fetchWithAuth(url, { method: 'GET' }, { fetcher })
  } catch (error) {
    const authError = mapAuthErrorToLocalError(error)
    if (authError) {
      return authError
    }
    throw error
  }
  const payload = await parseJsonResponse(response)
  if (response.status === 401) {
    return { key: 'auth_expired', value: '認証の有効期限が切れました。再ログインしてください。' }
  }
  if (!response.ok) {
    if (isLocalErrorPayload(payload)) {
      return payload
    }
    return { key: 'fetch_item_information_error', value: String(payload) }
  }
  if (isLocalErrorPayload(payload)) {
    return payload
  }
  return payload as FetchedItemData
}
