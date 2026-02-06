interface AchievementIndexPath {
  kindIndex: number
  categoryIndex: number
  groupIndex: number
  achievementIndex: number
}

interface UpdateCompleteAchievementArg {
  completedDate: Date
  kindIndex: number
  categoryIndex: number
  groupIndex: number
  achievementIndex: number
}

type CheckCompleteAchievementArg = UpdateCompleteAchievementArg & {
  checkedCategoryIndex: number
}
