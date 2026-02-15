import {
  applyForcedPatchIdDeletion,
  applyForcedPatchIdInsertion,
  applyForcedTagIdDeletion,
  applyForcedTagIdInsertion,
} from './categoryEditorDomain'
import {
  type AchievementEditorState,
  type PatchDefinitionModel,
  type TagDefinitionModel,
} from '../model/types'

/** 目的: タグ定義配列をID昇順に並び替える。副作用: なし。前提: 子タグを含む再帰構造を許容する。 */
export function sortTagDefinitionsById(tags: TagDefinitionModel[]): TagDefinitionModel[] {
  return [...tags]
    .map((tag) => ({
      ...tag,
      tags: sortTagDefinitionsById(Array.isArray(tag.tags) ? tag.tags : []),
    }))
    .sort((a, b) => a.id - b.id)
}

/** 目的: パッチ定義配列をID昇順に並び替える。副作用: なし。前提: patch定義はフラット配列である。 */
export function sortPatchDefinitionsById(patches: PatchDefinitionModel[]): PatchDefinitionModel[] {
  return [...patches].sort((a, b) => a.id - b.id)
}

/** 目的: タグ定義の最大IDを返す。副作用: なし。前提: 配列が空の場合は0を返す。 */
export function getLatestTagDefinitionId(tags: TagDefinitionModel[]): number {
  const currentMax = tags.reduce((maxValue, tag) => {
    const childMax = getLatestTagDefinitionId(Array.isArray(tag.tags) ? tag.tags : [])
    return Math.max(maxValue, tag.id, childMax)
  }, 0)
  return currentMax
}

/** 目的: パッチ定義の最大IDを返す。副作用: なし。前提: 配列が空の場合は0を返す。 */
export function getLatestPatchDefinitionId(patches: PatchDefinitionModel[]): number {
  return patches.reduce((maxValue, patch) => Math.max(maxValue, patch.id), 0)
}

/** 目的: 指定IDのタグを削除し、子タグをトップレベルへ昇格させる。副作用: なし。前提: tagIdは一意である。 */
export function removeTagDefinitionByIdWithPromote(
  tags: TagDefinitionModel[],
  tagId: number
): { tags: TagDefinitionModel[]; removed: boolean } {
  const promotedChildren: TagDefinitionModel[] = []

  /** 目的: 再帰的にタグ削除を適用する。副作用: promotedChildrenへ削除ノードの子を収集する。前提: currentTagsはTagDefinitionModel配列である。 */
  const removeRecursive = (
    currentTags: TagDefinitionModel[]
  ): { tags: TagDefinitionModel[]; removed: boolean } => {
    let hasRemoved = false
    const nextTags = currentTags.flatMap((tag) => {
      if (tag.id === tagId) {
        hasRemoved = true
        const children = Array.isArray(tag.tags) ? tag.tags : []
        promotedChildren.push(...children.map((child) => ({ ...child })))
        return []
      }
      const childResult = removeRecursive(Array.isArray(tag.tags) ? tag.tags : [])
      if (childResult.removed) {
        hasRemoved = true
      }
      return [
        {
          ...tag,
          tags: childResult.tags,
        },
      ]
    })
    return { tags: nextTags, removed: hasRemoved }
  }

  const removedResult = removeRecursive(tags)
  const mergedTopLevelTags = sortTagDefinitionsById([...removedResult.tags, ...promotedChildren])
  return {
    tags: mergedTopLevelTags,
    removed: removedResult.removed,
  }
}

/** 目的: 全editor stateへタグID挿入時の強制追従を適用する。副作用: なし。前提: insertedTagIdは挿入したタグIDを指す。 */
export function applyForcedTagInsertionAcrossEditorStates(
  states: AchievementEditorState[],
  tags: TagDefinitionModel[],
  insertedTagId: number
): { states: AchievementEditorState[]; tags: TagDefinitionModel[] } {
  let nextTags = tags
  const nextStates = states.map((state, index) => {
    const updated = applyForcedTagIdInsertion(state, tags, insertedTagId)
    if (index === 0) {
      nextTags = updated.tags
    }
    return updated.editorState
  })
  if (states.length === 0) {
    nextTags = applyForcedTagIdInsertion(
      {
        key: '',
        kindName: '',
        achievementCategories: [],
      },
      tags,
      insertedTagId
    ).tags
  }
  return {
    states: nextStates,
    tags: sortTagDefinitionsById(nextTags),
  }
}

/** 目的: 全editor stateへタグID削除時の強制追従を適用する。副作用: なし。前提: tagsは削除済み定義を受け取る。 */
export function applyForcedTagDeletionAcrossEditorStates(
  states: AchievementEditorState[],
  tags: TagDefinitionModel[],
  deletedTagId: number
): { states: AchievementEditorState[]; tags: TagDefinitionModel[] } {
  let nextTags = tags
  const nextStates = states.map((state, index) => {
    const updated = applyForcedTagIdDeletion(state, tags, deletedTagId)
    if (index === 0) {
      nextTags = updated.tags
    }
    return updated.editorState
  })
  if (states.length === 0) {
    nextTags = applyForcedTagIdDeletion(
      {
        key: '',
        kindName: '',
        achievementCategories: [],
      },
      tags,
      deletedTagId
    ).tags
  }
  return {
    states: nextStates,
    tags: sortTagDefinitionsById(nextTags),
  }
}

/** 目的: 全editor stateへパッチID挿入時の強制追従を適用する。副作用: なし。前提: insertedPatchIdは挿入したパッチIDを指す。 */
export function applyForcedPatchInsertionAcrossEditorStates(
  states: AchievementEditorState[],
  patches: PatchDefinitionModel[],
  insertedPatchId: number
): { states: AchievementEditorState[]; patches: PatchDefinitionModel[] } {
  let nextPatches = patches
  const nextStates = states.map((state, index) => {
    const updated = applyForcedPatchIdInsertion(state, patches, insertedPatchId)
    if (index === 0) {
      nextPatches = updated.patches
    }
    return updated.editorState
  })
  if (states.length === 0) {
    nextPatches = applyForcedPatchIdInsertion(
      {
        key: '',
        kindName: '',
        achievementCategories: [],
      },
      patches,
      insertedPatchId
    ).patches
  }
  return {
    states: nextStates,
    patches: sortPatchDefinitionsById(nextPatches),
  }
}

/** 目的: 全editor stateへパッチID削除時の強制追従を適用する。副作用: なし。前提: patchesは削除済み定義を受け取る。 */
export function applyForcedPatchDeletionAcrossEditorStates(
  states: AchievementEditorState[],
  patches: PatchDefinitionModel[],
  deletedPatchId: number
): { states: AchievementEditorState[]; patches: PatchDefinitionModel[] } {
  let nextPatches = patches
  const nextStates = states.map((state, index) => {
    const updated = applyForcedPatchIdDeletion(state, patches, deletedPatchId)
    if (index === 0) {
      nextPatches = updated.patches
    }
    return updated.editorState
  })
  if (states.length === 0) {
    nextPatches = applyForcedPatchIdDeletion(
      {
        key: '',
        kindName: '',
        achievementCategories: [],
      },
      patches,
      deletedPatchId
    ).patches
  }
  return {
    states: nextStates,
    patches: sortPatchDefinitionsById(nextPatches),
  }
}
