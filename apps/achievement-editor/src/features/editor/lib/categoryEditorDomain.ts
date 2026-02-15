import {
  type AchievementCategoryModel,
  type ChangeGroupTitleResult,
  type AchievementEditorState,
  type CreateGroupResult,
  type EditAchievementModel,
  type PatchDefinitionModel,
  type PatchField,
  type TagDefinitionModel,
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

/** 目的: カテゴリ内の未分類/分類済みアチーブメントへ同一変換を適用する。副作用: なし。前提: mapper は参照透過な変換関数である。 */
function mapAchievementsInCategory(
  category: AchievementCategoryModel,
  mapper: (achievement: EditAchievementModel) => EditAchievementModel
): AchievementCategoryModel {
  return {
    ...category,
    ungroup: category.ungroup.map(mapper),
    group: category.group.map((group) => ({
      ...group,
      data: group.data.map(mapper),
    })),
  }
}

/** 目的: 編集状態全体の全カテゴリへアチーブメント変換を適用する。副作用: なし。前提: editorState は有効なカテゴリ配列を持つ。 */
function mapAchievementsInEditorState(
  editorState: AchievementEditorState,
  mapper: (achievement: EditAchievementModel) => EditAchievementModel
): AchievementEditorState {
  return {
    ...editorState,
    achievementCategories: editorState.achievementCategories.map((category) =>
      mapAchievementsInCategory(category, mapper)
    ),
  }
}

/** 目的: タグ定義ツリーを再帰走査してID変換を適用する。副作用: なし。前提: tags は旧Tag構造互換で tags 配列を保持する。 */
function mapTagDefinitionsRecursive(
  tags: TagDefinitionModel[],
  mapper: (tag: TagDefinitionModel) => TagDefinitionModel
): TagDefinitionModel[] {
  return tags.map((tag) => {
    const nextChildren = Array.isArray(tag.tags)
      ? mapTagDefinitionsRecursive(tag.tags, mapper)
      : []
    const mappedTag: TagDefinitionModel = mapper({
      ...tag,
      tags: nextChildren,
    })
    return {
      ...mappedTag,
      tags: Array.isArray(mappedTag.tags) ? mappedTag.tags : [],
    }
  })
}

/** 目的: パッチ定義配列へID変換を適用する。副作用: なし。前提: patches は id を持つ配列である。 */
function mapPatchDefinitions(
  patches: PatchDefinitionModel[],
  mapper: (patch: PatchDefinitionModel) => PatchDefinitionModel
): PatchDefinitionModel[] {
  return patches.map((patch) => mapper({ ...patch }))
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

/** 目的: 指定グループの表示名を変更する。副作用: なし。前提: groupIndexは既存グループを指し、重複名は許可しない。 */
export function changeGroupTitleInCategory(
  category: AchievementCategoryModel,
  groupIndex: number,
  nextGroupTitle: string
): ChangeGroupTitleResult {
  const targetGroup = category.group[groupIndex]
  if (!targetGroup) {
    return {
      ok: false,
      errorCode: 'group_not_found',
      category,
    }
  }

  const normalizedTitle = nextGroupTitle.trim()
  if (normalizedTitle === '') {
    return {
      ok: false,
      errorCode: 'group_title_required',
      category,
    }
  }

  const hasDuplicatedTitle = category.group.some(
    (group, index) => index !== groupIndex && group.title === normalizedTitle
  )
  if (hasDuplicatedTitle) {
    return {
      ok: false,
      errorCode: 'group_already_exists',
      category,
    }
  }

  return {
    ok: true,
    category: {
      ...category,
      group: category.group.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              title: normalizedTitle,
            }
          : group
      ),
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

/** 目的: グループ内アチーブメント1件のtagIdsを個別更新する。副作用: なし。前提: groupIndex/dataIndex は既存要素を指し、tagIdsは数値配列である。 */
export function applySingleAchievementTagIds(
  category: AchievementCategoryModel,
  groupIndex: number,
  dataIndex: number,
  tagIds: number[]
): AchievementCategoryModel {
  const targetGroup = category.group[groupIndex]
  const targetAchievement = targetGroup?.data[dataIndex]
  if (!targetGroup || !targetAchievement) {
    return category
  }

  const normalizedTagIds = Array.from(
    new Set(
      tagIds.filter((tagId) => Number.isInteger(tagId) && tagId >= 0)
    )
  ).sort((a, b) => a - b)

  return {
    ...category,
    group: category.group.map((group, currentGroupIndex) =>
      currentGroupIndex === groupIndex
        ? {
            ...group,
            data: group.data.map((achievement, currentDataIndex) =>
              currentDataIndex === dataIndex
                ? { ...achievement, tagIds: normalizedTagIds }
                : achievement
            ),
          }
        : group
    ),
  }
}

/** 目的: グループ内アチーブメント1件のpatchId/adjustmentPatchIdを個別更新する。副作用: なし。前提: groupIndex/dataIndex は既存要素を指す。 */
export function applySingleAchievementPatchId(
  category: AchievementCategoryModel,
  groupIndex: number,
  dataIndex: number,
  patchField: PatchField,
  patchId: number
): AchievementCategoryModel {
  const targetGroup = category.group[groupIndex]
  const targetAchievement = targetGroup?.data[dataIndex]
  if (!targetGroup || !targetAchievement) {
    return category
  }

  const normalizedPatchId = Number.isInteger(patchId) && patchId >= 0 ? patchId : 0
  return {
    ...category,
    group: category.group.map((group, currentGroupIndex) =>
      currentGroupIndex === groupIndex
        ? {
            ...group,
            data: group.data.map((achievement, currentDataIndex) =>
              currentDataIndex === dataIndex
                ? { ...achievement, [patchField]: normalizedPatchId }
                : achievement
            ),
          }
        : group
    ),
  }
}

/** 目的: tag強制挿入時にアチーブメント参照tagIdsとtag定義IDを同時に繰り上げる。副作用: なし。前提: insertedTagId は挿入先ID(1以上)である。 */
export function applyForcedTagIdInsertion(
  editorState: AchievementEditorState,
  tags: TagDefinitionModel[],
  insertedTagId: number
): { editorState: AchievementEditorState; tags: TagDefinitionModel[] } {
  const nextEditorState = mapAchievementsInEditorState(editorState, (achievement) => ({
    ...achievement,
    tagIds: achievement.tagIds.map((tagId) => (tagId >= insertedTagId ? tagId + 1 : tagId)),
  }))
  const nextTags = mapTagDefinitionsRecursive(tags, (tag) => ({
    ...tag,
    id: tag.id >= insertedTagId ? tag.id + 1 : tag.id,
  }))
  return {
    editorState: nextEditorState,
    tags: nextTags,
  }
}

/** 目的: tag強制削除時にアチーブメント参照tagIdsから削除IDを除外し、後続IDを詰める。副作用: なし。前提: tags は削除対象が除去済みの定義配列である。 */
export function applyForcedTagIdDeletion(
  editorState: AchievementEditorState,
  tags: TagDefinitionModel[],
  deletedTagId: number
): { editorState: AchievementEditorState; tags: TagDefinitionModel[] } {
  const nextEditorState = mapAchievementsInEditorState(editorState, (achievement) => ({
    ...achievement,
    tagIds: achievement.tagIds
      .filter((tagId) => tagId !== deletedTagId)
      .map((tagId) => (tagId > deletedTagId ? tagId - 1 : tagId)),
  }))
  const nextTags = mapTagDefinitionsRecursive(tags, (tag) => ({
    ...tag,
    id: tag.id > deletedTagId ? tag.id - 1 : tag.id,
  }))
  return {
    editorState: nextEditorState,
    tags: nextTags,
  }
}

/** 目的: patch強制挿入時にアチーブメント参照adjustmentPatchIdとpatch定義IDを同時に繰り上げる。副作用: なし。前提: insertedPatchId は挿入先ID(1以上)である。 */
export function applyForcedPatchIdInsertion(
  editorState: AchievementEditorState,
  patches: PatchDefinitionModel[],
  insertedPatchId: number
): { editorState: AchievementEditorState; patches: PatchDefinitionModel[] } {
  const nextEditorState = mapAchievementsInEditorState(editorState, (achievement) => {
    if (achievement.adjustmentPatchId > 0 && achievement.adjustmentPatchId >= insertedPatchId) {
      return {
        ...achievement,
        adjustmentPatchId: achievement.adjustmentPatchId + 1,
      }
    }
    return achievement
  })
  const nextPatches = mapPatchDefinitions(patches, (patch) => ({
    ...patch,
    id: patch.id >= insertedPatchId ? patch.id + 1 : patch.id,
  }))
  return {
    editorState: nextEditorState,
    patches: nextPatches,
  }
}

/** 目的: patch強制削除時に削除ID参照を0化し、後続adjustmentPatchIdとpatch定義IDを詰める。副作用: なし。前提: patches は削除対象が除去済みの定義配列である。 */
export function applyForcedPatchIdDeletion(
  editorState: AchievementEditorState,
  patches: PatchDefinitionModel[],
  deletedPatchId: number
): { editorState: AchievementEditorState; patches: PatchDefinitionModel[] } {
  const nextEditorState = mapAchievementsInEditorState(editorState, (achievement) => {
    if (achievement.adjustmentPatchId <= 0) {
      return achievement
    }
    if (achievement.adjustmentPatchId === deletedPatchId) {
      return {
        ...achievement,
        adjustmentPatchId: 0,
      }
    }
    if (achievement.adjustmentPatchId > deletedPatchId) {
      return {
        ...achievement,
        adjustmentPatchId: achievement.adjustmentPatchId - 1,
      }
    }
    return achievement
  })
  const nextPatches = mapPatchDefinitions(patches, (patch) => ({
    ...patch,
    id: patch.id > deletedPatchId ? patch.id - 1 : patch.id,
  }))
  return {
    editorState: nextEditorState,
    patches: nextPatches,
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

/** 目的: グループ所属アチーブメントを別グループへ移動する。副作用: なし。前提: source/destinationのインデックスは既存グループを指す。 */
export function moveAchievementFromGroupToGroup(
  category: AchievementCategoryModel,
  sourceGroupIndex: number,
  sourceDataIndex: number,
  destinationGroupIndex: number
): AchievementCategoryModel {
  const sourceGroup = category.group[sourceGroupIndex]
  const destinationGroup = category.group[destinationGroupIndex]
  const movingAchievement = sourceGroup?.data[sourceDataIndex]
  if (!sourceGroup || !destinationGroup || !movingAchievement) {
    return category
  }
  if (sourceGroupIndex === destinationGroupIndex) {
    return category
  }

  const nextSourceGroupData = sortAchievementsBySourceIndex(
    sourceGroup.data.filter((_, index) => index !== sourceDataIndex)
  )
  const nextDestinationGroupData = sortAchievementsBySourceIndex([
    ...destinationGroup.data,
    movingAchievement,
  ])

  return {
    ...category,
    group: category.group.map((group, index) => {
      if (index === sourceGroupIndex) {
        return {
          ...group,
          data: nextSourceGroupData,
        }
      }
      if (index === destinationGroupIndex) {
        return {
          ...group,
          data: nextDestinationGroupData,
        }
      }
      return group
    }),
  }
}

/** 目的: グループ配列の表示順を移動する。副作用: なし。前提: from/to は group 配列の有効インデックスである。 */
export function moveGroupPositionInCategory(
  category: AchievementCategoryModel,
  fromIndex: number,
  toIndex: number
): AchievementCategoryModel {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= category.group.length ||
    toIndex >= category.group.length ||
    fromIndex === toIndex
  ) {
    return category
  }

  const nextGroups = [...category.group]
  const [movingGroup] = nextGroups.splice(fromIndex, 1)
  if (!movingGroup) {
    return category
  }
  nextGroups.splice(toIndex, 0, movingGroup)
  return {
    ...category,
    group: nextGroups,
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
