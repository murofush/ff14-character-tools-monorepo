import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  AuthTokenRequiredError,
  configureAuthTokenProvider,
  configureStaticBearerToken,
  fetchWithAuth,
  type AuthTokenProvider,
} from './authTokenClient'

/** 目的: fetch呼び出し時のAuthorizationヘッダ値を取り出す。副作用: なし。前提: init.headers は HeadersInit 互換である。 */
function getAuthorizationHeader(init: RequestInit | undefined): string | null {
  const headers = new Headers(init?.headers)
  return headers.get('Authorization')
}

describe('authTokenClient', () => {
  beforeEach(() => {
    configureAuthTokenProvider(null)
    configureStaticBearerToken(null)
  })

  test('static tokenをAuthorizationヘッダへ自動付与する', async () => {
    configureStaticBearerToken('static-token')
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response('{}', { status: 200 })
    })

    await fetchWithAuth('/api/save_text', { method: 'POST' }, { fetcher })

    expect(fetcher).toHaveBeenCalledTimes(1)
    const initArg = fetcher.mock.calls[0]?.[1]
    expect(getAuthorizationHeader(initArg)).toBe('Bearer static-token')
  })

  test('401時はトークン再取得して1回だけ再試行する', async () => {
    const provider: AuthTokenProvider = {
      getAccessToken: async (options?: { forceRefresh?: boolean }): Promise<string | null> => {
        if (options?.forceRefresh) {
          return 'token-v2'
        }
        return 'token-v1'
      },
    }
    configureAuthTokenProvider(provider)
    const fetcher = vi
      .fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
        return new Response('{}', { status: 401 })
      })
      .mockImplementationOnce(async (_input: RequestInfo | URL, _init?: RequestInit) => {
        return new Response('{}', { status: 401 })
      })
      .mockImplementationOnce(async (_input: RequestInfo | URL, _init?: RequestInit) => {
        return new Response('{}', { status: 200 })
      })

    await fetchWithAuth('/api/get_hidden_achievement', { method: 'GET' }, { fetcher })

    expect(fetcher).toHaveBeenCalledTimes(2)
    const firstInitArg = fetcher.mock.calls[0]?.[1]
    const secondInitArg = fetcher.mock.calls[1]?.[1]
    expect(getAuthorizationHeader(firstInitArg)).toBe('Bearer token-v1')
    expect(getAuthorizationHeader(secondInitArg)).toBe('Bearer token-v2')
  })

  test('token未設定時はAuthTokenRequiredErrorを返す', async () => {
    await expect(fetchWithAuth('/api/save_text', { method: 'POST' })).rejects.toBeInstanceOf(
      AuthTokenRequiredError
    )
  })

  test('再試行後も401ならonUnauthorizedを呼び出す', async () => {
    const onUnauthorized = vi.fn()
    const provider: AuthTokenProvider = {
      getAccessToken: async (): Promise<string | null> => 'token-v1',
      onUnauthorized,
    }
    configureAuthTokenProvider(provider)
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response('{}', { status: 401 })
    })

    const response = await fetchWithAuth('/api/save_text', { method: 'POST' }, { fetcher })

    expect(response.status).toBe(401)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
