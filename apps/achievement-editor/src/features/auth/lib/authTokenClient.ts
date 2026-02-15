export type AuthTokenProvider = {
  getAccessToken: (options?: { forceRefresh?: boolean }) => Promise<string | null>
  onUnauthorized?: () => void
}

type FetchWithAuthOptions = {
  fetcher?: typeof fetch
  retryOnUnauthorized?: boolean
}

let currentAuthTokenProvider: AuthTokenProvider | null = null
let staticBearerToken: string | null = null

/** 目的: API呼び出し時に利用する認証トークン提供者を登録する。副作用: グローバル状態を書き換える。前提: providerはアプリ初期化時に設定される。 */
export function configureAuthTokenProvider(provider: AuthTokenProvider | null): void {
  currentAuthTokenProvider = provider
}

/** 目的: 開発用の固定Bearerトークンを登録する。副作用: グローバル状態を書き換える。前提: tokenは空文字またはBearerトークン文字列である。 */
export function configureStaticBearerToken(token: string | null): void {
  const normalized = token?.trim() ?? ''
  staticBearerToken = normalized === '' ? null : normalized
}

/** 目的: 認証トークン未取得時に呼び出し側へログイン要求を通知する。副作用: なし。前提: API呼び出し前にトークン解決が必要である。 */
export class AuthTokenRequiredError extends Error {
  constructor() {
    super('認証情報がありません。再ログインしてください。')
    this.name = 'AuthTokenRequiredError'
  }
}

/** 目的: 登録済みproviderまたは固定トークンからアクセス用トークンを解決する。副作用: provider実装に応じて外部認証SDKへアクセスする。前提: providerはPromiseでtokenを返す。 */
async function resolveAccessToken(forceRefresh: boolean): Promise<string | null> {
  if (currentAuthTokenProvider) {
    const token = await currentAuthTokenProvider.getAccessToken({ forceRefresh })
    const normalized = token?.trim() ?? ''
    return normalized === '' ? null : normalized
  }
  return staticBearerToken
}

/** 目的: 既存ヘッダへAuthorizationを上書き追加したHeadersを生成する。副作用: なし。前提: tokenは空でない。 */
function buildAuthorizedHeaders(token: string, headers?: HeadersInit): Headers {
  const mergedHeaders = new Headers(headers)
  mergedHeaders.set('Authorization', `Bearer ${token}`)
  return mergedHeaders
}

/** 目的: 認証付きHTTPリクエストを実行し、401時はトークン更新後に1回だけ再試行する。副作用: HTTP通信を実行し、必要時にonUnauthorizedを呼ぶ。前提: 認証が必要なAPIで利用する。 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const fetcher = options.fetcher ?? fetch
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true

  const token = await resolveAccessToken(false)
  if (token === null) {
    throw new AuthTokenRequiredError()
  }

  const firstResponse = await fetcher(input, {
    ...init,
    headers: buildAuthorizedHeaders(token, init.headers),
  })

  if (!retryOnUnauthorized || firstResponse.status !== 401) {
    return firstResponse
  }

  const refreshedToken = await resolveAccessToken(true)
  if (refreshedToken === null) {
    currentAuthTokenProvider?.onUnauthorized?.()
    return firstResponse
  }

  const retryResponse = await fetcher(input, {
    ...init,
    headers: buildAuthorizedHeaders(refreshedToken, init.headers),
  })

  if (retryResponse.status === 401) {
    currentAuthTokenProvider?.onUnauthorized?.()
  }

  return retryResponse
}
