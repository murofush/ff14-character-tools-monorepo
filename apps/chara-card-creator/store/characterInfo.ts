import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { Context } from '@nuxt/types'
import aes from 'crypto-js/aes'
import utf8 from 'crypto-js/enc-utf8'
import { isResponseCharacterData } from '~/common/function'
import { AchievementStore } from '~/store'
import {
  BattleRoles,
  Crafter,
  Gatherer,
} from '@murofush/forfan-common-package/lib/types'
import {
  getAchievementCategoryByKindKey,
  margeBattleRolesObject,
  margeCraftObject,
  margGathererObject,
} from '@murofush/forfan-common-package/lib/function'
import {
  KIND,
  BATTLE_ROLES,
  CRAFTER,
  GATHERER,
} from '@murofush/forfan-common-package/lib/const'
import { SelectedCharaInfoStore } from '~/utils/store-accessor'

const characterDataKey = 'characterData'

interface VuexSyncAchievementArg {
  key: keyof typeof KIND
  checkingCategoryId?: string
}

@Module({
  name: 'characterInfo',
  stateFactory: true,
  namespaced: true,
})
export default class CharacterInfoModule extends VuexModule {
  private responseData: ResponseData | null = null
  private oldestAchievementDate: Date | null = null

  public get getResponseData() {
    return this.responseData
  }

  public get getOldestAchievementDate() {
    return this.oldestAchievementDate
  }

  public get getBattleJobWithLevel() {
    const battleRolesLevel = this.responseData?.characterData.battleRoles
    if (battleRolesLevel) {
      const jobWithLevel: BattleRoles<JobWithLevel> = margeBattleRolesObject(
        BATTLE_ROLES,
        battleRolesLevel
      )
      return jobWithLevel
    }
    return null
  }

  public get getCraftJobWithLevel() {
    const crafterLevel = this.responseData?.characterData.crafter
    if (crafterLevel) {
      const jobWithLevel: Crafter<JobWithLevel> = margeCraftObject(
        CRAFTER,
        crafterLevel
      )
      return jobWithLevel
    }
    return null
  }

  public get getGathererJobWithLevel() {
    const gathererLevel = this.responseData?.characterData.gatherer
    if (gathererLevel) {
      const jobWithLevel: Gatherer<JobWithLevel> = margGathererObject(
        GATHERER,
        gathererLevel
      )
      return jobWithLevel
    }
    return null
  }

  get getHighestLevelFromBattleJobs() {
    const battleRoles = this.responseData?.characterData.battleRoles
    if (!battleRoles) {
      console.error('INTERNAL ERROR: characterの情報が取得されていません。')
      return []
    }
    // const battleRole
  }

  @Mutation
  setResponseCharacterData(responseData: ResponseData | null) {
    if (responseData) {
      localStorage.setItem(
        characterDataKey,
        aes
          .encrypt(
            JSON.stringify(responseData),
            (process.env as any).ENCRYPT_KEY
          )
          .toString()
      )
    } else {
      localStorage.removeItem(characterDataKey)
    }
    this.responseData = responseData

    // SelectedCharaInfo更新
    SelectedCharaInfoStore.setDescription(
      responseData?.characterData.selfintroduction ?? ''
    )

    // 最古のアチーブメント取得
    let oldestAchievementDate: Date | null = null
    responseData?.completedAchievementsKinds.forEach((kind) => {
      kind.achievements.forEach((achievement) => {
        const checkDate = new Date(achievement.completedDate)
        if (!oldestAchievementDate || oldestAchievementDate > checkDate) {
          oldestAchievementDate = checkDate
        }
      })
    })
    this.oldestAchievementDate = oldestAchievementDate
  }

  @Action({ rawError: true })
  syncAchievementProcess(arg: VuexSyncAchievementArg) {
    const updateArgs: UpdateCompleteAchievementArg[] = []
    // indexの0番目もチェックするため
    let checkedCategoryIndex = -1
    let isCheckAllCategory = !arg.checkingCategoryId

    if (!this.responseData) {
      console.error('キャラクター情報が取得できていません。')
      return
    }

    const completedAchievementKind =
      this.responseData.completedAchievementsKinds.find((achievementData) => {
        if (achievementData) {
          return achievementData.key === arg.key
        }
      })
    const checkKindIndex = AchievementStore.getAchievementKinds.findIndex(
      (achievementData) => {
        if (achievementData) {
          return achievementData.key === arg.key
        }
      }
    )
    if (checkKindIndex === -1) {
      console.error(
        `アチーブメントリストから ${arg.key} が見つかりませんでした。`
      )
      return
    }
    if (!completedAchievementKind) {
      if (!AchievementStore.getAchievementKinds[checkKindIndex].kind.isSecret) {
        console.error(
          `キャラクターデータから ${arg.key} が見つかりませんでした。`
        )
      }
      return
    }

    const checkingCategoryIndex = AchievementStore.getAchievementKinds[
      checkKindIndex
    ].achievementCategories.findIndex((achievementCategory) => {
      return achievementCategory.category.id === arg.checkingCategoryId
    })
    if (checkingCategoryIndex === -1 && !isCheckAllCategory) {
      console.error(
        `CategoryID: ${arg.checkingCategoryId}が見つかりませんでした。`
      )
      isCheckAllCategory = true
    }

    // loadStoneからfetchして取得したコンプリート済みアチーブメントリストを編集済みのアチーブメント一覧情報とsyncさせる。
    const checkCompleteAchievement = (
      completedAchievement: CompletedAchievement,
      kindIndex: number,
      alreadyCheckedCategoryIndex: number
    ): CheckCompleteAchievementArg | null => {
      // uncategorizedはない想定で、データを探さない。
      let innerCheckedCategoryIndex = alreadyCheckedCategoryIndex
      for (const [
        categoryIndex,
        achievementCategory,
      ] of AchievementStore.getAchievementKinds[
        kindIndex
      ].achievementCategories.entries()) {
        // チェック済みのCategoryはスキップ
        if (
          (isCheckAllCategory && innerCheckedCategoryIndex >= categoryIndex) ||
          (!isCheckAllCategory && categoryIndex !== checkingCategoryIndex)
        ) {
          continue
        }
        // この階層のCategoryで見つかった場合、次のcheckCompleteAchievementでもこの階層をチェックさせたいため、あえて -1 させる。
        // 例: categoryIndex = -1 で見つかった場合
        innerCheckedCategoryIndex = categoryIndex - 1
        if (!achievementCategory) {
          continue
        }
        for (const [groupIndex, group] of achievementCategory.group.entries()) {
          const achievementIndex = group.data.findIndex((achievement) => {
            return completedAchievement.title === achievement.title
          })

          // crafting_gatheringで順番が前後してる関係上、取得できない場合があるので見つからなかった場合に再起処理を行うようにする
          if (achievementIndex !== -1) {
            return {
              completedDate: new Date(completedAchievement.completedDate),
              kindIndex,
              categoryIndex,
              groupIndex,
              achievementIndex,
              checkedCategoryIndex,
            } as CheckCompleteAchievementArg
          }
        }
      }
      return null
    }

    completedAchievementKind.achievements.forEach((completedAchievement) => {
      const updateArg = checkCompleteAchievement(
        completedAchievement,
        checkKindIndex,
        checkedCategoryIndex
      )
      if (updateArg) {
        if (isCheckAllCategory) {
          checkedCategoryIndex = updateArg.checkedCategoryIndex
        }
        updateArgs.push(updateArg)
        return
      } else if (checkedCategoryIndex > -1 && isCheckAllCategory) {
        // finishedCategoryIndexが進んでる状態で見つからなかった場合はfinishedCategoryIndexをリセットして全体から再検索
        checkedCategoryIndex = -1
        const researchedUpdateArg = checkCompleteAchievement(
          completedAchievement,
          checkKindIndex,
          checkedCategoryIndex
        )
        if (researchedUpdateArg) {
          checkedCategoryIndex = researchedUpdateArg.checkedCategoryIndex
          updateArgs.push(researchedUpdateArg)
          return
        }
      }
      // 全体通して見つからなかった場合
      if (isCheckAllCategory) {
        // CategoryIDが指定されている場合には、見つからないことが想定されているため、ここのログは流さない。
        console.error(
          `INTERNAL_ERROR: アチーブメント一覧から${completedAchievement.title} が見つかりませんでした。`
        )
      }
    })
    AchievementStore.updateSyncCompleteAchievementMutation(updateArgs)
  }

  @Action({ rawError: true })
  syncAchievementCategoryById(checkingCategoryId: string) {
    const kindKeyPair = getAchievementCategoryByKindKey(checkingCategoryId)
    if (!kindKeyPair) {
      console.error(
        `categoryID: ${checkingCategoryId}のKIND情報が見つかりませんでした。`
      )
      return
    }
    this.syncAchievementProcess({ key: kindKeyPair.key, checkingCategoryId })
    AchievementStore.setCheckSyncCategory(checkingCategoryId)
  }

  @Action({ rawError: true })
  syncAchievementKindByKey(key: keyof typeof KIND) {
    this.syncAchievementProcess({ key })
  }

  @Action({ rawError: true })
  syncAchievements() {
    console.log('syncAchievements')
    if (this.responseData) {
      AchievementStore.getAchievementKinds.forEach((achievementData) => {
        if (achievementData) {
          this.syncAchievementKindByKey(
            achievementData.key as keyof typeof KIND
          )
        }
      })
    }
  }

  @Action({ rawError: true })
  nuxtClientInit(_: Context) {
    try {
      const strageDataStr = (
        aes.decrypt(
          localStorage.getItem(characterDataKey) || '',
          (process.env as any).ENCRYPT_KEY
        ) || ''
      ).toString(utf8)
      let strageData
      if (strageDataStr) {
        strageData = JSON.parse(strageDataStr)
      }
      if (isResponseCharacterData(strageData)) {
        this.setResponseCharacterData(strageData)
        // return
      }
    } catch (ignore) {
      // エラーだった場合はstrageDataを削除して無視する
      localStorage.removeItem(characterDataKey)
    }
    // localStorage.removeItem(characterDataKey)
  }
}
