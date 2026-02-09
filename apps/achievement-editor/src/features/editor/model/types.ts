export type PatchField = 'patchId' | 'adjustmentPatchId'

export type EditAchievementModel = {
  id: string
  title: string
  description: string
  sourceIndex: number
  tagIds: number[]
  patchId: number
  adjustmentPatchId: number
  isLatestPatch: boolean
}

export type AchievementGroupModel = {
  title: string
  data: EditAchievementModel[]
}

export type AchievementCategoryModel = {
  title: string
  path: string
  ungroup: EditAchievementModel[]
  group: AchievementGroupModel[]
}

export type AchievementEditorState = {
  key: string
  kindName: string
  achievementCategories: AchievementCategoryModel[]
}

export type CreateGroupResult =
  | {
      ok: true
      category: AchievementCategoryModel
    }
  | {
      ok: false
      errorCode: 'group_title_required' | 'group_already_exists'
      category: AchievementCategoryModel
    }
