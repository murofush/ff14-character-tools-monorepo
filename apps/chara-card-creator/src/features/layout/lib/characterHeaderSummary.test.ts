import { describe, expect, test } from 'vitest'
import { buildCharacterHeaderSummary } from './characterHeaderSummary'

describe('buildCharacterHeaderSummary', () => {
  test('セッションが無い場合はnullを返す', () => {
    const result = buildCharacterHeaderSummary(null)
    expect(result).toBeNull()
  })

  test('表示に必要なキャラクター要約情報を組み立てる', () => {
    const result = buildCharacterHeaderSummary({
      characterID: 31299051,
      fetchedDate: '2026-02-17T00:00:00Z',
      characterData: {
        firstName: 'Light',
        lastName: 'Warrior',
        server: 'Ifrit',
        datacenter: 'Gaia',
        race: 'Hyur',
        clan: 'Midlander',
        gender: '♀',
        pvpTeamInfo: {
          name: 'Frontline Heroes',
        },
        battleRoles: {
          tank: {
            paladin: {
              name: 'Paladin',
              level: 100,
            },
          },
        },
      },
      completedAchievementsKinds: [],
      isAchievementPrivate: false,
      freecompanyInfo: {
        fcName: 'For Fan',
      },
    })

    expect(result).toEqual({
      characterName: 'Light Warrior',
      characterMetaLine: 'Ifrit / Gaia | Hyur Midlander ♀',
      profileDetailLines: ['FC: For Fan', 'PvP: Frontline Heroes', 'Jobs: Paladin Lv100'],
      lodestoneProfileUrl: 'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
    })
  })
})
