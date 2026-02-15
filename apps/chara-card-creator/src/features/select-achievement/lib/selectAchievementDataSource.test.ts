import { describe, expect, it } from 'vitest'
import {
  buildCompletedAchievementTitleMap,
  convertRawCategoryToSelectable,
  type RawEditedAchievementFile,
} from './selectAchievementDataSource'
import { type CharacterSessionResponse } from '../model/types'

/** 目的: 旧get_character_info互換の最小キャラクターセッションを生成する。副作用: なし。前提: completedTitlesは同一kind内の完了実績タイトル配列である。 */
function createCharacterSession(
  kindKey: string,
  completedTitles: string[]
): CharacterSessionResponse {
  return {
    characterID: 123,
    fetchedDate: '2026-02-15T00:00:00.000Z',
    characterData: {
      firstName: 'Test',
      lastName: 'Taro',
    },
    completedAchievementsKinds: [
      {
        key: kindKey,
        achievements: completedTitles.map((title, index) => ({
          title,
          completedDate: `2026-02-1${index}T00:00:00.000Z`,
        })),
      },
    ],
    isAchievementPrivate: false,
  }
}

describe('selectAchievementDataSource', () => {
  it('完了実績のタイトルマップをkindごとに構築できる', () => {
    const session = createCharacterSession('battle', ['A', 'B'])
    const map = buildCompletedAchievementTitleMap(session)

    expect(map.get('battle')?.get('A')).toBe('2026-02-10T00:00:00.000Z')
    expect(map.get('battle')?.get('B')).toBe('2026-02-11T00:00:00.000Z')
  })

  it('rawカテゴリを選択画面表示モデルへ変換し、未分類を除外して完了状態を付与できる', () => {
    const rawFile: RawEditedAchievementFile = {
      title: 'battle',
      categorized: [
        {
          title: '未分類',
          data: [
            {
              title: 'Uncategorized item',
              description: 'ignore',
            },
          ],
        },
        {
          title: '討伐',
          data: [
            {
              title: 'Completed achievement',
              description: 'done',
            },
            {
              title: 'Not completed achievement',
              description: 'todo',
            },
          ],
        },
      ],
    }

    const completedMap = buildCompletedAchievementTitleMap(
      createCharacterSession('battle', ['Completed achievement'])
    )
    const converted = convertRawCategoryToSelectable(rawFile, 'battle', 'battle', completedMap)

    expect(converted.path).toBe('battle')
    expect(converted.group).toHaveLength(1)
    expect(converted.group[0]?.title).toBe('討伐')
    expect(converted.group[0]?.data[0]?.isCompleted).toBe(true)
    expect(converted.group[0]?.data[1]?.isCompleted).toBe(false)
  })
})
