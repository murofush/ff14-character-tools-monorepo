import {
  type AchievementCategoryModel,
  type AchievementEditorState,
  type CreateGroupResult,
  type EditAchievementModel,
  type PatchField,
} from '../model/types'

/** 目的: sourceIndex比較時に未設定値を -1 として扱う。副作用: なし。前提: sourceIndex は数値で受け取る。 */
function normalizeSourceIndex(sourceIndex: number): number {
  return Number.isFinite(sourceIndex) ? sourceIndex : -1
}

/** 目的: sourceIndex順ソートの比較関数を提供する。副作用: なし。前提: -1 は末尾へ送る旧仕様を維持する。 */
function compareBySourceIndex(a: EditAchievementModel, b: EditAchievementModel): number {
  const aIndex = normalizeSourceIndex(a.sourceIndex)
  const bIndex = normalizeSourceIndex(b.sourceIndex)
  if (aIndex === -1 && bIndex !== -1) {
    return 1
  }
  if (aIndex !== -1 && bIndex === -1) {
    return -1
  }
  return aIndex - bIndex
}

/** 目的: 配列を非破壊で sourceIndex 順に並び替える。副作用: なし。前提: 要素は EditAchievementModel 配列である。 */
export function sortAchievementsBySourceIndex(items: EditAchievementModel[]): EditAchievementModel[] {
  return [...items].sort(compareBySourceIndex)
}

/** 目的: グループ内全要素の共通タグIDを抽出する。副作用: なし。前提: groupIndex は存在するグループを指す。 */
export function getCommonTagIdsInGroup(
  category: AchievementCategoryModel,
  groupIndex: number
): number[] {
  const group = category.group[groupIndex]
  if (!group || group.data.length === 0) {
    return []
  }

  let commonTagIds = [...group.data[0].tagIds]
  for (let i = 1; i < group.data.length; i += 1) {
    const currentTagIdSet = new Set(group.data[i].tagIds)
    commonTagIds = commonTagIds.filter((tagId) => currentTagIdSet.has(tagId))
  }
  return commonTagIds
}

/** 目的: グループ内全要素で一致するパッチIDを返す。副作用: なし。前提: 一致しない場合は 0 を返す契約とする。 */
export function getCommonPatchIdInGroup(
  category: AchievementCategoryModel,
  groupIndex: number,
  patchField: PatchField
): number {
  const group = category.group[groupIndex]
  if (!group || group.data.length === 0) {
    return 0
  }
  const basePatchId = group.data[0][patchField]
  for (let i = 1; i < group.data.length; i += 1) {
    if (group.data[i][patchField] !== basePatchId) {
      return 0
    }
  }
  return basePatchId || 0
}

/** 目的: 既存カテゴリへ新規グループを追加する。副作用: なし。前提: 同名グループは作成不可とする。 */
export function createGroupInCategory(
  category: AchievementCategoryModel,
  groupTitle: string
): CreateGroupResult {
  const normalizedTitle = groupTitle.trim()
  if (normalizedTitle === '') {
    return { ok: false, errorCode: 'group_title_required', category }
  }
  const hasDuplicatedTitle = category.group.some((group) => group.title === normalizedTitle)
  if (hasDuplicatedTitle) {
    return { ok: false, errorCode: 'group_already_exists', category }
  }
  return {
    ok: true,
    category: {
      ...category,
      group: [...category.group, { title: normalizedTitle, data: [] }],
    },
  }
}

/** 目的: 指定グループを削除し、内部データを未分類へ戻す。副作用: なし。前提: groupIndex が範囲外の場合は元データを返す。 */
export function deleteGroupFromCategory(
  category: AchievementCategoryModel,
  groupIndex: number
): AchievementCategoryModel {
  const deletedGroup = category.group[groupIndex]
  if (!deletedGroup) {
    return category
  }
  const nextUngroup = sortAchievementsBySourceIndex([...category.ungroup, ...deletedGroup.data])
  return {
    ...category,
    ungroup: nextUngroup,
    group: category.group.filter((_, index) => index !== groupIndex),
  }
}

/** 目的: グループ共通タグ編集を各アチーブメントへ適用する。副作用: なし。前提: 旧実装同様に共通タグの追加/削除のみを反映する。 */
export function applyGroupTagIds(
  category: AchievementCategoryModel,
  groupIndex: number,
  nextCommonTagIds: number[]
): AchievementCategoryModel {
  const currentGroup = category.group[groupIndex]
  if (!currentGroup) {
    return category
  }
  const baseCommonTagIds = getCommonTagIdsInGroup(category, groupIndex)
  const removedTagIds = baseCommonTagIds.filter((tagId) => !nextCommonTagIds.includes(tagId))

  const nextGroupData = currentGroup.data.map((achievement) => {
    const unionTagIds = Array.from(new Set([...achievement.tagIds, ...nextCommonTagIds])).sort((a, b) => a - b)
    const filteredTagIds = unionTagIds.filter((tagId) => !removedTagIds.includes(tagId))
    return { ...achievement, tagIds: filteredTagIds }
  })

  return {
    ...category,
    group: category.group.map((group, index) =>
      index === groupIndex ? { ...group, data: nextGroupData } : group
    ),
  }
}

/** 目的: グループ単位の patchId / adjustmentPatchId 編集を一括反映する。副作用: なし。前提: patchField は既定の2種類のみ。 */
export function applyGroupPatchId(
  category: AchievementCategoryModel,
  groupIndex: number,
  patchField: PatchField,
  nextPatchId: number
): AchievementCategoryModel {
  const currentGroup = category.group[groupIndex]
  if (!currentGroup) {
    return category
  }
  const nextGroupData = currentGroup.data.map((achievement) => ({
    ...achievement,
    [patchField]: nextPatchId,
  }))
  return {
    ...category,
    group: category.group.map((group, index) =>
      index === groupIndex ? { ...group, data: nextGroupData } : group
    ),
  }
}

/** 目的: 未分類アチーブメントを指定グループへ移動する。副作用: なし。前提: 各インデックスは既存要素を指す。 */
export function moveAchievementFromUngroupToGroup(
  category: AchievementCategoryModel,
  ungroupIndex: number,
  groupIndex: number
): AchievementCategoryModel {
  const movingAchievement = category.ungroup[ungroupIndex]
  const destinationGroup = category.group[groupIndex]
  if (!movingAchievement || !destinationGroup) {
    return category
  }

  const nextUngroup = sortAchievementsBySourceIndex(
    category.ungroup.filter((_, index) => index !== ungroupIndex)
  )
  const nextGroupData = sortAchievementsBySourceIndex([...destinationGroup.data, movingAchievement])

  return {
    ...category,
    ungroup: nextUngroup,
    group: category.group.map((group, index) =>
      index === groupIndex ? { ...group, data: nextGroupData } : group
    ),
  }
}

/** 目的: グループ内アチーブメントを未分類へ戻す。副作用: なし。前提: groupIndex/dataIndex は既存要素を指す。 */
export function moveAchievementFromGroupToUngroup(
  category: AchievementCategoryModel,
  groupIndex: number,
  dataIndex: number
): AchievementCategoryModel {
  const sourceGroup = category.group[groupIndex]
  const movingAchievement = sourceGroup?.data[dataIndex]
  if (!sourceGroup || !movingAchievement) {
    return category
  }

  const nextSourceGroupData = sortAchievementsBySourceIndex(
    sourceGroup.data.filter((_, index) => index !== dataIndex)
  )
  const nextUngroup = sortAchievementsBySourceIndex([...category.ungroup, movingAchievement])

  return {
    ...category,
    ungroup: nextUngroup,
    group: category.group.map((group, index) =>
      index === groupIndex ? { ...group, data: nextSourceGroupData } : group
    ),
  }
}

/** 目的: カテゴリ単位の変更有無を比較する。副作用: なし。前提: 比較対象はJSONシリアライズ可能なデータである。 */
function isCategoryDirty(
  baseCategory: AchievementCategoryModel | undefined,
  currentCategory: AchievementCategoryModel | undefined
): boolean {
  return JSON.stringify(baseCategory) !== JSON.stringify(currentCategory)
}

/** 目的: 旧itemsEditor同様に更新されたカテゴリインデックス一覧を返す。副作用: なし。前提: 両stateのカテゴリ配列順は一致している。 */
export function getUpdatedCategoryIndices(
  baseState: AchievementEditorState,
  currentState: AchievementEditorState
): number[] {
  const updatedIndices: number[] = []
  currentState.achievementCategories.forEach((currentCategory, index) => {
    if (isCategoryDirty(baseState.achievementCategories[index], currentCategory)) {
      updatedIndices.push(index)
    }
  })
  return updatedIndices
}
