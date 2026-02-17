export type AchievementKindKey =
  | 'battle'
  | 'character'
  | 'crafting_gathering'
  | 'exploration'
  | 'grand_company'
  | 'items'
  | 'legacy'
  | 'pvp'
  | 'quests'

export type AchievementIndexPath = {
  kindIndex: number
  categoryIndex: number
  groupIndex: number
  achievementIndex: number
}

export type CompletedAchievement = {
  title: string
  completedDate: string
}

export type CompletedAchievementsKind = {
  key: string
  achievements: CompletedAchievement[]
}

export type CharacterSessionResponse = {
  characterID: number
  fetchedDate: string
  characterData: Record<string, unknown>
  completedAchievementsKinds: CompletedAchievementsKind[]
  isAchievementPrivate: boolean
  freecompanyInfo?: Record<string, unknown>
}

export type SelectableAchievement = {
  title: string
  description: string
  iconUrl?: string
  iconPath?: string
  point?: number
  url?: string
  sourceIndex: number
  patchId: number
  adjustmentPatchId: number
  tagIds: number[]
  isLatestPatch: boolean
  titleAward?: string
  titleAwardMan?: string
  titleAwardWoman?: string
  itemAward?: string
  itemAwardUrl?: string
  itemAwardImageUrl?: string
  itemAwardImagePath?: string
  awardCondition?: string[]
  isCompleted: boolean
  completedDate?: string
}

export type SelectableAchievementGroup = {
  title: string
  data: SelectableAchievement[]
}

export type SelectableAchievementCategory = {
  title: string
  path: string
  group: SelectableAchievementGroup[]
}

export type AchievementCategoryDefinition = {
  id: string
  name: string
}

export type AchievementKindDefinition = {
  key: AchievementKindKey
  name: string
  categories: AchievementCategoryDefinition[]
}

export type SelectedAchievementItem = {
  indexes: AchievementIndexPath
  data: SelectableAchievement
  kindName: string
  categoryName: string
  groupTitle: string
}
