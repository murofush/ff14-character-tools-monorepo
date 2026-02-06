import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import {
  LocalError,
  EditAchievement,
  AchievementCategory,
  FetchedAchievementKind,
} from '@murofush/forfan-common-package/lib/types'
import {
  getEditAchievementDataFromCloudStorage,
  getOutputAchievementFile,
  getOutputAchievementTableGroupFromEdit,
  isLocalError,
} from '@murofush/forfan-common-package/lib/function'
import { KIND } from '@murofush/forfan-common-package/lib/const'

import { $axios } from '~/utils/api'

@Module({
  name: 'achievement',
  stateFactory: true,
  namespaced: true,
})
export default class AchievementModule extends VuexModule {
  private achievementDataList: FetchedAchievementKind<EditAchievement>[] = []
  private isLoaded: boolean = false

  public get getAchievementDataList() {
    return this.achievementDataList
  }

  get isLoading() {
    return this.isLoaded
  }

  @Mutation
  setAchievementDataList(
    achievementDataList: FetchedAchievementKind<EditAchievement>[]
  ) {
    this.achievementDataList = achievementDataList
  }

  @Mutation
  setAchievementTableGroupByKey(
    tableGroup: AchievementCategory<EditAchievement>,
    key: string,
    listIndex: number
  ) {
    const groupIndex = this.achievementDataList.findIndex((achievementData) => {
      return achievementData.key === key
    })
    if (groupIndex === -1) {
      return {
        key: 'group_not_found_by_key',
        value: '指定したカテゴリーKeyが見つかりませんでした。',
      } as LocalError
    }
    this.achievementDataList[groupIndex].achievementCategories[listIndex] =
      tableGroup
  }

  @Mutation
  loaded() {
    this.isLoaded = true
  }

  @Action({ rawError: true })
  async fetchAchievements() {
    if (!this.isLoading) {
      const achievementDataList: FetchedAchievementKind<EditAchievement>[] = []
      await Promise.all(
        Object.keys(KIND).map(async (key) => {
          const FetchedAchievement =
            await getEditAchievementDataFromCloudStorage(
              key as keyof typeof KIND,
              true
            )
          achievementDataList.push(FetchedAchievement)
        })
      )
      this.loaded()
      this.setAchievementDataList(achievementDataList)
    }
  }

  @Action({ rawError: true })
  async postAchievementDataListByKey(
    postAchievementByKey: VuexPostAchievemntByKey
  ): Promise<LocalError | void> {
    const groupIndex = this.achievementDataList.findIndex((achievementData) => {
      return achievementData.key === postAchievementByKey.key
    })
    if (groupIndex === -1) {
      return {
        key: 'group_not_found_by_key',
        value: `key: ${postAchievementByKey.key}が見つかりませんでした。`,
      } as LocalError
    }
    try {
      await $axios.$post('/api/save_text', {
        text: JSON.stringify(
          getOutputAchievementTableGroupFromEdit(
            postAchievementByKey.AchievementCategory
          ),
          null,
          '\t'
        ),
        path: getOutputAchievementFile(
          postAchievementByKey.key,
          postAchievementByKey.AchievementCategory.path
        ),
      })
    } catch (error: any) {
      return { key: 'post_firebase_error', value: error } as LocalError
    }
    this.setAchievementTableGroupByKey(
      postAchievementByKey.AchievementCategory,
      postAchievementByKey.key,
      postAchievementByKey.listIndex
    )
  }

  @Action({ rawError: true })
  async postgetAchievementDataListGroup(
    achievementDataList: FetchedAchievementKind<EditAchievement>[]
  ): Promise<LocalError | void> {
    const errors: LocalError[] = []
    await Promise.all(
      achievementDataList.map(async (data) => {
        await Promise.all(
          data.achievementCategories.map(async (list, listIndex) => {
            const error = await this.postAchievementDataListByKey({
              AchievementCategory: list,
              key: data.key,
              listIndex,
            } as VuexPostAchievemntByKey)
            if (error && isLocalError(error)) {
              errors.push(error)
            }
          })
        )
      })
    )
  }
}
