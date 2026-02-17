import { describe, expect, it } from 'vitest'
import { isCharacterSessionResponse } from './characterSessionStorage'

describe('characterSessionStorage', () => {
  it('freecompanyInfo なしの旧互換レスポンスを許容する', () => {
    const result = isCharacterSessionResponse({
      characterID: 1,
      fetchedDate: '2026-02-01T00:00:00.000Z',
      characterData: {},
      completedAchievementsKinds: [],
      isAchievementPrivate: false,
    })

    expect(result).toBe(true)
  })

  it('freecompanyInfo がオブジェクトであれば許容する', () => {
    const result = isCharacterSessionResponse({
      characterID: 1,
      fetchedDate: '2026-02-01T00:00:00.000Z',
      characterData: {},
      completedAchievementsKinds: [],
      isAchievementPrivate: false,
      freecompanyInfo: {
        fcName: 'Sample',
      },
    })

    expect(result).toBe(true)
  })

  it('freecompanyInfo が非オブジェクトの場合は不正と判定する', () => {
    const result = isCharacterSessionResponse({
      characterID: 1,
      fetchedDate: '2026-02-01T00:00:00.000Z',
      characterData: {},
      completedAchievementsKinds: [],
      isAchievementPrivate: false,
      freecompanyInfo: 'invalid',
    })

    expect(result).toBe(false)
  })
})
