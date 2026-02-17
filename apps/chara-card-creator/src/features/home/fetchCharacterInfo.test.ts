import { describe, expect, it, vi } from 'vitest'
import { fetchCharacterInfoFromBackend } from './fetchCharacterInfo'

describe('fetchCharacterInfoFromBackend', () => {
  it('backendのget_character_infoを呼び、characterIDを返せる', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          characterID: 31299051,
          fetchedDate: '2026-02-12T10:00:00Z',
          characterData: {
            firstName: 'Test',
            lastName: 'Taro',
          },
          completedAchievementsKinds: [
            {
              key: 'battle',
              achievements: [
                {
                  title: 'Sample achievement',
                  completedDate: '2026-02-12T10:00:00Z',
                },
              ],
            },
          ],
          isAchievementPrivate: false,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    const result = await fetchCharacterInfoFromBackend(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      {
        backendBaseUrl: 'http://localhost:8080',
        fetcher,
      }
    )

    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:8080/api/get_character_info?url=https%3A%2F%2Fjp.finalfantasyxiv.com%2Flodestone%2Fcharacter%2F31299051'
    )
    expect(result).toEqual({
      ok: true,
      value: {
        characterID: 31299051,
        fetchedDate: '2026-02-12T10:00:00Z',
        characterData: {
          firstName: 'Test',
          lastName: 'Taro',
        },
        completedAchievementsKinds: [
          {
            key: 'battle',
            achievements: [
              {
                title: 'Sample achievement',
                completedDate: '2026-02-12T10:00:00Z',
              },
            ],
          },
        ],
        isAchievementPrivate: false,
      },
    })
  })

  it('backendがLocalErrorを返した場合はメッセージへ変換する', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          key: 'url_invalid',
          value: 'URLを設定してください。',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    const result = await fetchCharacterInfoFromBackend(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      {
        backendBaseUrl: 'http://localhost:8080',
        fetcher,
      }
    )

    expect(result).toEqual({
      ok: false,
      message: 'URLを設定してください。',
    })
  })

  it('freecompanyInfo が存在する場合はレスポンスへ保持する', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          characterID: 31299051,
          fetchedDate: '2026-02-12T10:00:00Z',
          characterData: {
            firstName: 'Test',
            lastName: 'Taro',
          },
          completedAchievementsKinds: [],
          isAchievementPrivate: false,
          freecompanyInfo: {
            fcName: 'Sample FC',
            positionName: 'Officer',
            fcCrestBaseImageUrls: ['/a.png', '/b.png'],
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    const result = await fetchCharacterInfoFromBackend(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      {
        backendBaseUrl: 'http://localhost:8080',
        fetcher,
      }
    )

    expect(result).toEqual({
      ok: true,
      value: {
        characterID: 31299051,
        fetchedDate: '2026-02-12T10:00:00Z',
        characterData: {
          firstName: 'Test',
          lastName: 'Taro',
        },
        completedAchievementsKinds: [],
        isAchievementPrivate: false,
        freecompanyInfo: {
          fcName: 'Sample FC',
          positionName: 'Officer',
          fcCrestBaseImageUrls: ['/a.png', '/b.png'],
        },
      },
    })
  })

  it('backend がHTMLを返した場合は接続設定の案内メッセージを返す', async () => {
    const fetcher = vi.fn(async () =>
      new Response('<!doctype html><html><body>not json</body></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
    )

    const result = await fetchCharacterInfoFromBackend(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      {
        backendBaseUrl: '',
        fetcher,
      }
    )

    expect(result).toEqual({
      ok: false,
      message:
        'キャラクター情報の取得に失敗しました: APIレスポンスがJSONではありません。バックエンド接続またはViteの/apiプロキシ設定を確認してください。',
    })
  })

  it('進捗コールバックへ取得プロセスを順に通知する', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          characterID: 31299051,
          fetchedDate: '2026-02-12T10:00:00Z',
          characterData: {
            firstName: 'Test',
            lastName: 'Taro',
          },
          completedAchievementsKinds: [],
          isAchievementPrivate: false,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
    const progressMessages: string[] = []

    await fetchCharacterInfoFromBackend(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      {
        backendBaseUrl: 'http://localhost:8080',
        fetcher,
        onProgress: (message: string): void => {
          progressMessages.push(message)
        },
      }
    )

    expect(progressMessages).toEqual([
      'APIエンドポイントを組み立てています。',
      'バックエンドへリクエストを送信しています。',
      'レスポンスを受信しました。',
      'レスポンスJSONを解析しています。',
      'キャラクター情報を検証しています。',
      'キャラクター情報の取得が完了しました。',
    ])
  })
})
