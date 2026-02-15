import { describe, expect, test } from 'vitest'
import {
  applyForcedPatchIdDeletion,
  applyForcedPatchIdInsertion,
  applyForcedTagIdDeletion,
  applyForcedTagIdInsertion,
  applyGroupTagIds,
  changeGroupTitleInCategory,
  moveAchievementFromGroupToGroup,
  applySingleAchievementPatchId,
  applySingleAchievementTagIds,
  createGroupInCategory,
  deleteGroupFromCategory,
  getCommonPatchIdInGroup,
  getCommonTagIdsInGroup,
  getUpdatedCategoryIndices,
  moveGroupPositionInCategory,
  moveAchievementFromGroupToUngroup,
  moveAchievementFromUngroupToGroup,
  sortAchievementsBySourceIndex,
} from './categoryEditorDomain'
import {
  type AchievementCategoryModel,
  type AchievementEditorState,
  type EditAchievementModel,
  type PatchDefinitionModel,
  type TagDefinitionModel,
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

/** 目的: 複数カテゴリを跨ぐ参照ID更新テスト用の編集状態を生成する。副作用: なし。前提: 旧VueのachievementDataList相当として1state内に複数カテゴリを持つ。 */
function createEditorStateFixture(): AchievementEditorState {
  return {
    key: 'all',
    kindName: 'All',
    achievementCategories: [
      {
        title: 'battle',
        path: 'battle',
        ungroup: [createAchievement('u1', 0, [1, 3], 0, 2)],
        group: [
          {
            title: 'g1',
            data: [createAchievement('g1-1', 1, [2, 4], 0, 4)],
          },
        ],
      },
      {
        title: 'items',
        path: 'items',
        ungroup: [createAchievement('u2', 0, [3, 5], 0, 3)],
        group: [
          {
            title: 'g2',
            data: [createAchievement('g2-1', 1, [1], 0, 5)],
          },
        ],
      },
    ],
  }
}

/** 目的: タグ定義の最小テストデータを生成する。副作用: なし。前提: idは1始まりで連番を想定する。 */
function createTagDefinitionsFixture(): TagDefinitionModel[] {
  return [
    {
      id: 1,
      name: 'Tag 1',
      tags: [],
    },
    {
      id: 3,
      name: 'Tag 3',
      tags: [
        {
          id: 4,
          name: 'Tag 4',
          tags: [],
        },
      ],
    },
  ]
}

/** 目的: タグ削除後（削除対象除去済み）を想定したテストデータを生成する。副作用: なし。前提: 旧delete処理後にforce更新する順序を再現する。 */
function createTagDefinitionsAfterDeleteFixture(): TagDefinitionModel[] {
  return [
    {
      id: 1,
      name: 'Tag 1',
      tags: [],
    },
    {
      id: 4,
      name: 'Tag 4',
      tags: [],
    },
  ]
}

/** 目的: パッチ定義の最小テストデータを生成する。副作用: なし。前提: idは1始まりで連番を想定する。 */
function createPatchDefinitionsFixture(): PatchDefinitionModel[] {
  return [
    { id: 1, number: '6.1' },
    { id: 3, number: '6.3' },
    { id: 5, number: '6.5' },
  ]
}

/** 目的: パッチ削除後（削除対象除去済み）を想定したテストデータを生成する。副作用: なし。前提: 旧delete処理後にforce更新する順序を再現する。 */
function createPatchDefinitionsAfterDeleteFixture(): PatchDefinitionModel[] {
  return [
    { id: 1, number: '6.1' },
    { id: 5, number: '6.5' },
  ]
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

  test('グループ名をダイアログ編集想定で更新できる', () => {
    const category = {
      ...createCategoryFixture(),
      group: [
        ...createCategoryFixture().group,
        {
          title: 'Group 2',
          data: [],
        },
      ],
    }
    const renamed = changeGroupTitleInCategory(category, 0, 'Updated Group')
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) {
      throw new Error('group rename should be success')
    }
    expect(renamed.category.group[0].title).toBe('Updated Group')

    const duplicated = changeGroupTitleInCategory(category, 0, 'Group 2')
    expect(duplicated.ok).toBe(false)
    if (duplicated.ok) {
      throw new Error('group rename duplicate should fail')
    }
    expect(duplicated.errorCode).toBe('group_already_exists')
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

  test('グループ内アチーブメント個別のタグIDを更新できる', () => {
    const category = createCategoryFixture()
    const updated = applySingleAchievementTagIds(category, 0, 1, [9, 4, 9])

    expect(updated.group[0].data[0].tagIds).toEqual([1, 2])
    expect(updated.group[0].data[1].tagIds).toEqual([4, 9])
  })

  test('グループ内アチーブメント個別のpatchId/adjustmentPatchIdを更新できる', () => {
    const category = createCategoryFixture()
    const updatedPatchId = applySingleAchievementPatchId(category, 0, 0, 'patchId', 11)
    const updatedAdjustmentPatchId = applySingleAchievementPatchId(
      updatedPatchId,
      0,
      1,
      'adjustmentPatchId',
      7
    )

    expect(updatedAdjustmentPatchId.group[0].data[0].patchId).toBe(11)
    expect(updatedAdjustmentPatchId.group[0].data[1].patchId).toBe(5)
    expect(updatedAdjustmentPatchId.group[0].data[0].adjustmentPatchId).toBe(1)
    expect(updatedAdjustmentPatchId.group[0].data[1].adjustmentPatchId).toBe(7)
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

  test('グループ→別グループへドラッグ移動できる', () => {
    const category = {
      ...createCategoryFixture(),
      group: [
        ...createCategoryFixture().group,
        {
          title: 'Group 2',
          data: [createAchievement('g2-a', 10, [3], 1, 1)],
        },
      ],
    }

    const moved = moveAchievementFromGroupToGroup(category, 0, 1, 1)
    expect(moved.group[0].data.map((item) => item.title)).toEqual(['g1-a'])
    expect(moved.group[1].data.map((item) => item.title)).toEqual(['g1-b', 'g2-a'])
  })

  test('グループ順をドラッグ移動できる', () => {
    const category = {
      ...createCategoryFixture(),
      group: [
        ...createCategoryFixture().group,
        {
          title: 'Group 2',
          data: [],
        },
        {
          title: 'Group 3',
          data: [],
        },
      ],
    }

    const moved = moveGroupPositionInCategory(category, 0, 2)
    expect(moved.group.map((group) => group.title)).toEqual(['Group 2', 'Group 3', 'Group 1'])
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

  test('tag強制挿入で参照tagIdsとtag定義idを閾値以上インクリメントする', () => {
    const editorState = createEditorStateFixture()
    const tags = createTagDefinitionsFixture()

    const result = applyForcedTagIdInsertion(editorState, tags, 3)

    expect(result.editorState.achievementCategories[0].ungroup[0].tagIds).toEqual([1, 4])
    expect(result.editorState.achievementCategories[0].group[0].data[0].tagIds).toEqual([2, 5])
    expect(result.editorState.achievementCategories[1].ungroup[0].tagIds).toEqual([4, 6])
    expect(result.editorState.achievementCategories[1].group[0].data[0].tagIds).toEqual([1])
    expect(result.tags.map((tag) => tag.id)).toEqual([1, 4])
    expect(result.tags[1].tags[0]?.id).toBe(5)
  })

  test('tag強制削除で参照tagIdsから削除IDを除去し、後続IDをデクリメントする', () => {
    const editorState = createEditorStateFixture()
    const tags = createTagDefinitionsAfterDeleteFixture()

    const result = applyForcedTagIdDeletion(editorState, tags, 3)

    expect(result.editorState.achievementCategories[0].ungroup[0].tagIds).toEqual([1])
    expect(result.editorState.achievementCategories[0].group[0].data[0].tagIds).toEqual([2, 3])
    expect(result.editorState.achievementCategories[1].ungroup[0].tagIds).toEqual([4])
    expect(result.editorState.achievementCategories[1].group[0].data[0].tagIds).toEqual([1])
    expect(result.tags.map((tag) => tag.id)).toEqual([1, 3])
  })

  test('patch強制挿入でadjustmentPatchIdとpatch定義idを閾値以上インクリメントする', () => {
    const editorState = createEditorStateFixture()
    const patches = createPatchDefinitionsFixture()

    const result = applyForcedPatchIdInsertion(editorState, patches, 3)

    expect(result.editorState.achievementCategories[0].ungroup[0].adjustmentPatchId).toBe(2)
    expect(result.editorState.achievementCategories[0].group[0].data[0].adjustmentPatchId).toBe(5)
    expect(result.editorState.achievementCategories[1].ungroup[0].adjustmentPatchId).toBe(4)
    expect(result.editorState.achievementCategories[1].group[0].data[0].adjustmentPatchId).toBe(6)
    expect(result.patches.map((patch) => patch.id)).toEqual([1, 4, 6])
  })

  test('patch強制削除でadjustmentPatchIdの削除IDを0化し、後続IDをデクリメントする', () => {
    const editorState = createEditorStateFixture()
    const patches = createPatchDefinitionsAfterDeleteFixture()

    const result = applyForcedPatchIdDeletion(editorState, patches, 3)

    expect(result.editorState.achievementCategories[0].ungroup[0].adjustmentPatchId).toBe(2)
    expect(result.editorState.achievementCategories[0].group[0].data[0].adjustmentPatchId).toBe(3)
    expect(result.editorState.achievementCategories[1].ungroup[0].adjustmentPatchId).toBe(0)
    expect(result.editorState.achievementCategories[1].group[0].data[0].adjustmentPatchId).toBe(4)
    expect(result.patches.map((patch) => patch.id)).toEqual([1, 4])
  })
})
