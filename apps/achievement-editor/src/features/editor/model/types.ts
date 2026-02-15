export type PatchField = 'patchId' | 'adjustmentPatchId'

export type EditAchievementModel = {
  id: string
  title: string
  description: string
  iconUrl?: string
  iconPath?: string
  point?: number
  url?: string
  isCreated?: boolean
  isEdited?: boolean
  isNowCreated?: boolean
  titleAward?: string
  titleAwardMan?: string
  titleAwardWoman?: string
  itemAward?: string
  itemAwardUrl?: string
  itemAwardImageUrl?: string
  itemAwardImagePath?: string
  awardCondition?: string[]
  sourceIndex: number
  tagIds: number[]
  patchId: number
  adjustmentPatchId: number
  isLatestPatch: boolean
  raw?: Record<string, unknown>
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

export type TagDefinitionModel = {
  id: number
  tags: TagDefinitionModel[]
  [key: string]: unknown
}

export type PatchDefinitionModel = {
  id: number
  [key: string]: unknown
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

export type ChangeGroupTitleResult =
  | {
      ok: true
      category: AchievementCategoryModel
    }
  | {
      ok: false
      errorCode: 'group_title_required' | 'group_already_exists' | 'group_not_found'
      category: AchievementCategoryModel
    }
