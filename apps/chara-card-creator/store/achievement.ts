import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import {
  AchievementCategory,
  AchievementKind,
  CompletedAchievement,
} from '@murofush/forfan-common-package/lib/types'
import {
  getCompletedAchievementKindFromCloudStorage,
  getCompletedAchievementCategoryFromCloudStorage,
  getAchievementCategoryByKindKey,
} from '@murofush/forfan-common-package/lib/function'
import { KIND } from '@murofush/forfan-common-package/lib/const'

@Module({
  name: 'achievement',
  stateFactory: true,
  namespaced: true,
})
export default class AchievementModule extends VuexModule {
  // achievementKind, achievementKind.achievementCategoriesともに順不同
  private achievementKinds: AchievementKind<CompletedAchievement>[] = []

  // データが取得済みかどうかのフラグ
  private checkSyncedKinds: checkSyncedKind[] = []

  // MEMO: これを呼び出す前に `AchievementStore.fetchAcievementKindByKey(key)`からデータを事前に取得すること
  public get getAchievementByTitle() {
    const self = this
    return (key: keyof typeof KIND, title: string) => {
      const achievementIndex = getDataIndex(self.achievementKinds, key)
      if (achievementIndex !== -1) {
        for (const achievementCategory of self.achievementKinds[
          achievementIndex
        ].achievementCategories) {
          for (const categories of achievementCategory.group) {
            for (const achievement of categories.data) {
              if (achievement.title === title) {
                return achievement
              }
            }
          }
        }
      }
    }
  }

  public get getAchievementKinds() {
    return this.achievementKinds
  }

  public get isSynced() {
    const self = this
    return (categoryId: string) => {
      const kindKeyPair = getAchievementCategoryByKindKey(categoryId)
      if (!kindKeyPair) {
        console.error(
          `INTERNAL_ERROR: CategoryID: ${categoryId}からKIND情報が見つかりませんでした。}`
        )
        return false
      }
      return !!self.checkSyncedKinds
        .find((kind) => {
          return kind.key === kindKeyPair.key
        })
        ?.fetchedCategoryIds.find((fetchedCategoryId) => {
          return fetchedCategoryId === categoryId
        })
    }
  }

  public get getCheckSyncedKinds() {
    return this.checkSyncedKinds
  }

  @Mutation
  setAchievementKindsMutation(
    achievementKinds: AchievementKind<CompletedAchievement>[]
  ) {
    this.achievementKinds = achievementKinds
  }

  @Mutation
  setCheckSyncedKindsMutation(checkSyncedKind: checkSyncedKind[]) {
    this.checkSyncedKinds = checkSyncedKind
  }

  @Mutation
  resetAchievementKindsMutation() {
    this.achievementKinds = []
    this.checkSyncedKinds = []
  }

  @Mutation
  initializeAchievementKindsMutation(
    achievementKinds: AchievementKind<CompletedAchievement>[]
  ) {
    this.achievementKinds = achievementKinds
  }

  // @Mutation
  // setAchievementKindMutation(
  //   achievementData: AchievementKind<CompletedAchievement>
  // ) {
  //   const achievementKindIndex = this.achievementKinds.findIndex((kind) => {
  //     return kind.key === achievementData.key
  //   })
  //   const checkSyncedKindIndex = this.checkSyncedKinds.findIndex((kind) => {
  //     return kind.key === achievementData.key
  //   })
  //   if (achievementKindIndex !== -1 && checkSyncedKindIndex !== -1) {
  //     this.achievementKinds[achievementKindIndex] = achievementData
  //     this.checkSyncedKinds[checkSyncedKindIndex].fetchedCategoryIds
  //   } else {
  //     console.error(
  //       `${achievementData} に該当するカテゴリーが見つかりませんでした。 achievementKindIndex: ${achievementKindIndex}, checkSyncedKinds: ${checkSyncedKinds}`
  //     )
  //   }
  // }

  @Mutation
  setCheckSyncedCategoryMutation(categoryId: string) {
    const kindKeyPair = getAchievementCategoryByKindKey(categoryId)
    if (!kindKeyPair) {
      console.error(
        `INTERNAL_ERROR: CategoryID: ${categoryId}からKIND情報が見つかりませんでした。`
      )
      return
    }

    // checkSyncedKinds
    const checkSyncedKindIndex = Object.values(this.checkSyncedKinds).findIndex(
      (checkSyncedKind) => {
        return checkSyncedKind.key === kindKeyPair.key
      }
    )
    if (checkSyncedKindIndex === -1) {
      console.error(
        `INTERNAL_ERROR: checkSyncedKinds.Kind ${kindKeyPair.key}の値が存在しません。`
      )
      return
    }
    // 値更新
    if (
      !this.checkSyncedKinds[checkSyncedKindIndex].fetchedCategoryIds.includes(
        categoryId
      )
    ) {
      this.checkSyncedKinds[checkSyncedKindIndex].fetchedCategoryIds.push(
        categoryId
      )
    }
  }

  @Mutation
  setAchievementCategoryMutation(
    achievementCategory: AchievementCategory<CompletedAchievement>
  ) {
    const kindKeyPair = getAchievementCategoryByKindKey(
      achievementCategory.category.id
    )
    if (!kindKeyPair) {
      console.error(
        `INTERNAL_ERROR: CategoryID: ${
          achievementCategory.category.id
        }からKIND情報が見つかりませんでした。\n AchievementCategory: ${JSON.stringify(
          achievementCategory
        )}`
      )
      return
    }

    const achievementKindIndex = Object.values(this.achievementKinds).findIndex(
      (achievementKind) => {
        return achievementKind.key === kindKeyPair.key
      }
    )
    if (achievementKindIndex === -1) {
      console.error(
        `INTERNAL_ERROR: achievementKinds.Kind ${kindKeyPair.key}の値が存在しません。`
      )
      return
    }
    const isCategoryInsideKind = !!this.achievementKinds[
      achievementKindIndex
    ].kind.categories.find((category) => {
      return category.id === achievementCategory.category.id
    })
    if (!isCategoryInsideKind) {
      console.error(
        `INTERNAL_ERROR: 引数の${JSON.stringify(
          achievementCategory.category
        )} はKind ${kindKeyPair.key}の中にが存在しません。`
      )
      return
    }

    // achievementKinds
    const achievementCateoryIndex = this.achievementKinds[
      achievementKindIndex
    ].achievementCategories.findIndex((checkAchievementCategory) => {
      return (
        checkAchievementCategory.category.id === achievementCategory.category.id
      )
    })
    // categoryIdが存在する場合は上書きする（しても問題ない想定）
    if (achievementCateoryIndex === -1) {
      console.error(
        `INTERNAL_ERROR: 引数の${JSON.stringify(
          achievementCategory.category
        )} AchievementKind ${
          this.achievementKinds[achievementKindIndex]
        }の中にが存在しません。`
      )
    }
    // 値更新
    this.achievementKinds[achievementKindIndex].achievementCategories[
      achievementCateoryIndex
    ] = achievementCategory
  }

  @Mutation
  updateSyncCompleteAchievementMutation(args: UpdateCompleteAchievementArg[]) {
    args.forEach((arg) => {
      this.achievementKinds[arg.kindIndex].achievementCategories[
        arg.categoryIndex
      ].group[arg.groupIndex].data[arg.achievementIndex].completedDate =
        arg.completedDate

      this.achievementKinds[arg.kindIndex].achievementCategories[
        arg.categoryIndex
      ].group[arg.groupIndex].data[arg.achievementIndex].isCompleted = true
    })
  }

  // 現在は使ってない
  // @Action({ rawError: true })
  // async fetchAllAchievement() {
  //   const achievementKinds: AchievementKind<CompletedAchievement>[] =
  //     new Array(Object.entries(KIND).length)
  //   await Promise.all(
  //     Object.keys(KIND).map(async (key, index) => {
  //       const fetchedAchievementKind =
  //         await getCompletedAchievementKindFromCloudStorage(
  //           key as keyof typeof KIND
  //         )
  //       achievementKinds[index] = fetchedAchievementKind
  //     })
  //   )
  //   this.initializeAchievementKindsMutation(achievementKinds)
  // }

  // TODO: Achievementをcategoriesからもっと細かく取得するように
  @Action({ rawError: true })
  async fetchAcievementKindByKey(key: keyof typeof KIND) {
    console.log('fetchAcievementKindByKey :key=>', key)
    const fetchedDataIndex = getDataIndex(this.achievementKinds, key)
    console.log(fetchedDataIndex)
    if (fetchedDataIndex !== -1) {
      // データが取得されてるかどうか
      if (this.achievementKinds[fetchedDataIndex]) {
        const categoryLength =
          this.achievementKinds[fetchedDataIndex].kind.categories.length
        const fetchedDatalength =
          this.achievementKinds[fetchedDataIndex].achievementCategories.length
        console.log('categoryLength', categoryLength)
        console.log('fetchedDatalength', fetchedDatalength)
        if (categoryLength <= fetchedDatalength) {
          return
        }
      }
    }
    // 取得されてない場合、CloudStorageから取得する
    console.log(`getCompletedAchievementKindFromCloudStorage(${key})`)
    const fetchedAchievementKind =
      await getCompletedAchievementKindFromCloudStorage(key)
    console.log(fetchedAchievementKind)
    fetchedAchievementKind.achievementCategories.forEach(
      (achievementCategory) => {
        this.setAchievementCategoryMutation(achievementCategory)
      }
    )
    // this.setAchievementKindMutation(fetchedAchievementKind)
  }

  @Action({ rawError: true })
  async fetchAchievementCategoryById(categoryId: string) {
    const kindKeyPair = getAchievementCategoryByKindKey(categoryId)
    if (!kindKeyPair) {
      console.error(
        `INTERNAL_ERROR: CategoryID: ${categoryId}からKIND情報が見つかりませんでした。}`
      )
      return
    }
    // 指定されたCategoryIdの存在チェック
    const findCategory = kindKeyPair.kind.categories.find((category) => {
      return category.id === categoryId
    })
    if (findCategory == null) {
      console.error(
        `INTERNAL_ERROR: Kind ${kindKeyPair.key} > Category ${categoryId}が取得できませんでした。`
      )
      return
    }
    const fetchedAchievementCategory =
      await getCompletedAchievementCategoryFromCloudStorage(
        kindKeyPair.key,
        categoryId
      )

    // errorMessageが内包されてる場合
    if (fetchedAchievementCategory.errorMessage) {
      console.error(fetchedAchievementCategory.errorMessage)
    } else {
      this.setAchievementCategoryMutation(fetchedAchievementCategory)
    }
  }

  @Action({ rawError: true })
  resetAchievements() {
    Object.entries(KIND).forEach(([key, kind], index) => {
      const achievementCategories = kind.categories.map((category) => {
        return {
          category,
          ungroup: [],
          group: [],
        } as AchievementCategory<CompletedAchievement>
      })
      const achievementKind: AchievementKind<CompletedAchievement> = {
        key: key,
        kind: kind,
        achievementCategories,
      }
      const checkSyncedKinds: checkSyncedKind = {
        key: key,
        fetchedCategoryIds: [],
      }
      this.achievementKinds[index] = achievementKind
      this.checkSyncedKinds[index] = checkSyncedKinds
    })
  }

  @Action({ rawError: true })
  setCheckSyncCategory(categoryId: string) {
    this.setCheckSyncedCategoryMutation(categoryId)
  }

  @Action({ rawError: true })
  nuxtServerInit() {
    this.resetAchievements()
  }
}

function getDataIndex(
  achievementKinds: AchievementKind<CompletedAchievement>[],
  key: keyof typeof KIND
): number {
  return achievementKinds.findIndex((data) => {
    if (data && data.key) {
      return data.key === key
    }
  })
}
