import { describe, expect, test } from 'vitest'
import {
  applyForcedPatchDeletionAcrossEditorStates,
  applyForcedPatchInsertionAcrossEditorStates,
  applyForcedTagDeletionAcrossEditorStates,
  applyForcedTagInsertionAcrossEditorStates,
  removeTagDefinitionByIdWithPromote,
} from './forceUpdateDomain'
import {
  type AchievementEditorState,
  type PatchDefinitionModel,
  type TagDefinitionModel,
} from '../model/types'

/** 目的: テスト向けのアチーブメント状態を生成する。副作用: なし。前提: adjustmentPatchId/tagIds 更新検証のため最小構造のみ持つ。 */
function createEditorState(key: string): AchievementEditorState {
  return {
    key,
    kindName: key,
    achievementCategories: [
      {
        title: `${key}-cat`,
        path: `${key}-cat`,
        ungroup: [
          {
            id: `${key}-u`,
            title: `${key}-u`,
            description: `${key}-u`,
            sourceIndex: 0,
            tagIds: [1, 3],
            patchId: 0,
            adjustmentPatchId: 3,
            isLatestPatch: false,
          },
        ],
        group: [
          {
            title: `${key}-g`,
            data: [
              {
                id: `${key}-g-1`,
                title: `${key}-g-1`,
                description: `${key}-g-1`,
                sourceIndex: 1,
                tagIds: [2, 4],
                patchId: 0,
                adjustmentPatchId: 4,
                isLatestPatch: false,
              },
            ],
          },
        ],
      },
    ],
  }
}

/** 目的: テスト用のタグ定義を返す。副作用: なし。前提: ネスト1段の構造を持つ。 */
function createTags(): TagDefinitionModel[] {
  return [
    { id: 1, name: 'tag1', tags: [] },
    {
      id: 3,
      name: 'tag3',
      tags: [{ id: 4, name: 'tag4', tags: [] }],
    },
  ]
}

/** 目的: テスト用のパッチ定義を返す。副作用: なし。前提: idが離散値で並ぶ。 */
function createPatches(): PatchDefinitionModel[] {
  return [
    { id: 1, number: '6.1' },
    { id: 3, number: '6.3' },
    { id: 4, number: '6.4' },
  ]
}

describe('forceUpdateDomain', () => {
  test('tag挿入強制更新を全editor stateへ適用する', () => {
    const states = [createEditorState('battle'), createEditorState('items')]
    const tags = createTags()

    const result = applyForcedTagInsertionAcrossEditorStates(states, tags, 3)

    expect(result.tags.map((tag) => tag.id)).toEqual([1, 4])
    expect(result.tags[1].tags[0]?.id).toBe(5)
    expect(result.states[0].achievementCategories[0].ungroup[0].tagIds).toEqual([1, 4])
    expect(result.states[1].achievementCategories[0].group[0].data[0].tagIds).toEqual([2, 5])
  })

  test('tag削除強制更新を全editor stateへ適用する', () => {
    const states = [createEditorState('battle'), createEditorState('items')]
    const tagsAfterDelete = [{ id: 1, name: 'tag1', tags: [] }, { id: 4, name: 'tag4', tags: [] }]

    const result = applyForcedTagDeletionAcrossEditorStates(states, tagsAfterDelete, 3)

    expect(result.tags.map((tag) => tag.id)).toEqual([1, 3])
    expect(result.states[0].achievementCategories[0].ungroup[0].tagIds).toEqual([1])
    expect(result.states[1].achievementCategories[0].group[0].data[0].tagIds).toEqual([2, 3])
  })

  test('patch挿入強制更新を全editor stateへ適用する', () => {
    const states = [createEditorState('battle'), createEditorState('items')]
    const patches = createPatches()

    const result = applyForcedPatchInsertionAcrossEditorStates(states, patches, 3)

    expect(result.patches.map((patch) => patch.id)).toEqual([1, 4, 5])
    expect(result.states[0].achievementCategories[0].ungroup[0].adjustmentPatchId).toBe(4)
    expect(result.states[1].achievementCategories[0].group[0].data[0].adjustmentPatchId).toBe(5)
  })

  test('patch削除強制更新を全editor stateへ適用する', () => {
    const states = [createEditorState('battle'), createEditorState('items')]
    const patchesAfterDelete = [{ id: 1, number: '6.1' }, { id: 4, number: '6.4' }]

    const result = applyForcedPatchDeletionAcrossEditorStates(states, patchesAfterDelete, 3)

    expect(result.patches.map((patch) => patch.id)).toEqual([1, 3])
    expect(result.states[0].achievementCategories[0].ungroup[0].adjustmentPatchId).toBe(0)
    expect(result.states[1].achievementCategories[0].group[0].data[0].adjustmentPatchId).toBe(3)
  })

  test('タグ削除で子タグをトップレベルへ退避しつつ削除できる', () => {
    const tags = [
      { id: 1, name: 'tag1', tags: [] },
      {
        id: 3,
        name: 'tag3',
        tags: [{ id: 4, name: 'tag4', tags: [] }],
      },
    ]

    const result = removeTagDefinitionByIdWithPromote(tags, 3)

    expect(result.removed).toBe(true)
    expect(result.tags.map((tag) => tag.id)).toEqual([1, 4])
  })
})
