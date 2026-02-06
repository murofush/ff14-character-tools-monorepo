import {
  AchievementUrl,
  CategoryUrl,
  EditAchievement,
  FetchedAchievement,
} from '@murofush/forfan-common-package/lib/types'
import Vue from 'vue'
import {
  isEditAchievement,
  isFetchedAchievement,
  isAchievementUrl,
  isCategoryUrl,
  arrayTypeCheck,
} from '@murofush/forfan-common-package/lib/function'
/**
 * TODO: Mixinからメソッドの呼び出し時にthisで参照できない問題の解決
 */
export default Vue.extend({
  methods: {
    isEditAchievement(arg: any): arg is EditAchievement {
      return isEditAchievement(arg)
    },
    isEditAchievementArray(arg: any): arg is EditAchievement[] {
      return arrayTypeCheck(arg, isEditAchievement)
    },
    isFetchedAchievement(arg: any): arg is FetchedAchievement {
      return isFetchedAchievement(arg)
    },
    isAchievementUrl(arg: any): arg is AchievementUrl {
      return isAchievementUrl(arg)
    },
    isCategoryUrl(arg: any): arg is CategoryUrl {
      return isCategoryUrl(arg)
    },
  },
})
