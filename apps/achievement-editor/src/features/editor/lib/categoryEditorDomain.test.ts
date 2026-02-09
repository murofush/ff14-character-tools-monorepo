import { describe, expect, test } from 'vitest'
import {
  applyGroupTagIds,
  createGroupInCategory,
  deleteGroupFromCategory,
  getCommonPatchIdInGroup,
  getCommonTagIdsInGroup,
  getUpdatedCategoryIndices,
  moveAchievementFromGroupToUngroup,
  moveAchievementFromUngroupToGroup,
  sortAchievementsBySourceIndex,
} from './categoryEditorDomain'
import {
  type AchievementCategoryModel,
  type AchievementEditorState,
  type EditAchievementModel,
} from '../model/types'

/** 目的: テスト向けのアチーブメントデータを一貫して生成する。副作用: なし。前提: title/sourceIndex/tagIds は呼び出し側が指定する。 */
function createAchievement(
  title: string,
  sourceIndex: number,
  tagIds: number[],
  patchId: number = 0,
  adjustmentPatchId: number = 0
): EditAchievementModel {
  return {
    id: `${title}-${sourceIndex}`,
    title,
    description: `${title} description`,
    sourceIndex,
    tagIds,
    patchId,
    adjustmentPatchId,
    isLatestPatch: false,
  }
}

/** 目的: テスト対象カテゴリの初期値を構築する。副作用: なし。前提: 並び順検証のため sourceIndex が混在している。 */
function createCategoryFixture(): AchievementCategoryModel {
  return {
    title: 'Battle',
    path: 'battle',
    ungroup: [
      createAchievement('z', -1, [1]),
      createAchievement('a', 0, [1, 2], 3, 2),
      createAchievement('b', 2, [2, 3], 3, 2),
    ],
    group: [
      {
        title: 'Group 1',
        data: [
          createAchievement('g1-a', 3, [1, 2], 5, 1),
          createAchievement('g1-b', 1, [2, 3], 5, 1),
        ],
      },
    ],
  }
}

describe('categoryEditorDomain', () => {
  test('sourceIndex の並び替えで -1 を末尾へ送る', () => {
    const sorted = sortAchievementsBySourceIndex([
      createAchievement('a', -1, []),
      createAchievement('b', 5, []),
      createAchievement('c', 0, []),
      createAchievement('d', 2, []),
    ])
    expect(sorted.map((item) => item.title)).toEqual(['c', 'd', 'b', 'a'])
  })

  test('グループ共通タグIDを抽出する', () => {
    const category = createCategoryFixture()
    expect(getCommonTagIdsInGroup(category, 0)).toEqual([2])
  })

  test('グループ共通パッチIDを返し、不一致時は0を返す', () => {
    const category = createCategoryFixture()
    expect(getCommonPatchIdInGroup(category, 0, 'patchId')).toBe(5)
    const updated = {
      ...category,
      group: [
        {
          ...category.group[0],
          data: [
            category.group[0].data[0],
            { ...category.group[0].data[1], patchId: 9 },
          ],
        },
      ],
    }
    expect(getCommonPatchIdInGroup(updated, 0, 'patchId')).toBe(0)
  })

  test('同名グループは作成できない', () => {
    const category = createCategoryFixture()
    const result = createGroupInCategory(category, 'Group 1')
    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error('group_already_exists expected')
    }
    expect(result.errorCode).toBe('group_already_exists')
  })

  test('グループ削除時に子要素を未分類へ戻して並び替える', () => {
    const category = createCategoryFixture()
    const result = deleteGroupFromCategory(category, 0)
    expect(result.group).toHaveLength(0)
    expect(result.ungroup.map((item) => item.title)).toEqual(['a', 'g1-b', 'b', 'g1-a', 'z'])
  })

  test('グループタグ変更で共通タグのみ追加/削除する', () => {
    const category = createCategoryFixture()
    const added = applyGroupTagIds(category, 0, [2, 4])
    expect(added.group[0].data[0].tagIds).toEqual([1, 2, 4])
    expect(added.group[0].data[1].tagIds).toEqual([2, 3, 4])

    const removed = applyGroupTagIds(added, 0, [4])
    expect(removed.group[0].data[0].tagIds).toEqual([1, 4])
    expect(removed.group[0].data[1].tagIds).toEqual([3, 4])
  })

  test('未分類→グループ、グループ→未分類の移動ができる', () => {
    const category = createCategoryFixture()
    const movedToGroup = moveAchievementFromUngroupToGroup(category, 1, 0)
    expect(movedToGroup.ungroup.map((item) => item.title)).toEqual(['b', 'z'])
    expect(movedToGroup.group[0].data.map((item) => item.title)).toEqual(['a', 'g1-b', 'g1-a'])

    const movedToUngroup = moveAchievementFromGroupToUngroup(movedToGroup, 0, 1)
    expect(movedToUngroup.ungroup.map((item) => item.title)).toEqual(['g1-b', 'b', 'z'])
    expect(movedToUngroup.group[0].data.map((item) => item.title)).toEqual(['a', 'g1-a'])
  })

  test('カテゴリ差分インデックスを返す', () => {
    const baseCategory = createCategoryFixture()
    const baseState: AchievementEditorState = {
      key: 'battle',
      kindName: 'Battle',
      achievementCategories: [baseCategory],
    }

    const changedState: AchievementEditorState = {
      ...baseState,
      achievementCategories: [createGroupInCategory(baseCategory, 'New Group').category],
    }

    expect(getUpdatedCategoryIndices(baseState, changedState)).toEqual([0])
    expect(getUpdatedCategoryIndices(baseState, baseState)).toEqual([])
  })
})
