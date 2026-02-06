import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'

@Module({
  name: 'achievementSelectorState',
  stateFactory: true,
  namespaced: true,
})
export default class AchievementSelectorStateIndexModule extends VuexModule {
  // data
  private achievementIndex: AchievementIndexPath = {
    kindIndex: 0,
    categoryIndex: 0,
    groupIndex: 0,
    achievementIndex: 0,
  }
  private isPanelOpened = true
  private isPanelShowing = false

  // getter
  get getAchievementIndex(): AchievementIndexPath {
    return this.achievementIndex
  }

  get getIsPanelOpened(): boolean {
    return this.isPanelOpened
  }

  get getIsPanelShowing(): boolean {
    return this.isPanelShowing
  }

  // Mutation
  @Mutation
  setAchievementIndexMutation(achievementIndex: AchievementIndexPath) {
    this.achievementIndex = achievementIndex
  }

  @Mutation
  setIsPanelOpenedMutation(isPanelOpened: boolean) {
    this.isPanelOpened = isPanelOpened
  }

  @Mutation
  setIsPanelShowingMutation(isPanelShowing: boolean) {
    this.isPanelShowing = isPanelShowing
  }

  // Action
  @Action
  setAchievementIndexPath(achievementIndex: AchievementIndexPath) {
    this.setAchievementIndexMutation(achievementIndex)
  }

  @Action
  setAchievementCategoryIndex(index: number) {
    const newAcivevementIndex = {
      ...this.achievementIndex,
      kindIndex: index,
    }
    this.setAchievementIndexMutation(newAcivevementIndex)
  }

  @Action
  setCategoryIndex(index: number) {
    const newAcivevementIndex = {
      ...this.achievementIndex,
      categoryIndex: index,
    }
    newAcivevementIndex.categoryIndex = index
    this.setAchievementIndexMutation(newAcivevementIndex)
  }

  @Action
  setGroupIndex(index: number) {
    const newAcivevementIndex = {
      ...this.achievementIndex,
      groupIndex: index,
    }
    this.setAchievementIndexMutation(newAcivevementIndex)
  }

  @Action
  setDataIndex(index: number) {
    const newAcivevementIndex = {
      ...this.achievementIndex,
      achievementIndex: index,
    }
    this.setAchievementIndexMutation(newAcivevementIndex)
  }

  @Action
  setIsPanelOpened(isPanelOpened: boolean) {
    this.setIsPanelOpenedMutation(isPanelOpened)
  }

  @Action
  setIsPanelShowing(isPanelShowing: boolean) {
    if (!isPanelShowing) {
      this.setIsPanelOpenedMutation(true)
    }
    this.setIsPanelShowingMutation(isPanelShowing)
  }
}
