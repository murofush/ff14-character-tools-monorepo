/*
 * 引数等、簡易的に使われる型の定義ファイル
 * このやり方がただしいかどうか分かってないけど、型定義自体は欲しいから記述
 */

/**
 * componentsのGroupCreatorのclickで使う
 */
interface EmitGroupCreator {
  title: string
}

/**
 * OUTPUT_SNACKBARに関するinterface
 */
interface EmitOutputSnackbar {
  text: string
  color?: string
  timeout?: number
}

/**
 * achievementStoreのpostAchievementDataListByKeyで使用する
 */
interface VuexPostAchievemntByKey {
  AchievementCategory: import('@murofush/forfan-common-package/lib/types').AchievementCategory<
    import('@murofush/forfan-common-package/lib/types').EditAchievement
  >
  key: string
  listIndex: number
}
