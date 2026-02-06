import { KIND } from '@murofush/forfan-common-package/lib/const'
import {
  CompletedAchievement,
  AchievementKind,
  Group,
  Kind,
} from '@murofush/forfan-common-package/lib/types'
import Vue from 'vue'
import {
  borderHeight,
  headerHeight,
  navigationDrawerHeaderHeight,
  tabsHeight,
} from '~/common/const'
import {
  AchievementSelectorStateStore,
  AchievementStore,
  CharacterInfoStore,
} from '~/store'
export default Vue.extend({
  computed: {
    KindValues(): Kind[] {
      return Object.values(KIND)
    },
    KindKeys(): string[] {
      return Object.keys(KIND)
    },
    isSynced(): boolean {
      const isSynced = AchievementStore.isSynced(
        this.KindValues[(this as any).selectedKindIndex].categories[
          this.selectedCategoryIndex
        ]?.id ?? -1
      )
      return isSynced
    },
    navigationDrawerHeaderStyle(): Object {
      return {
        height: `${navigationDrawerHeaderHeight}px`,
        fontSize: `${navigationDrawerHeaderHeight / 2}px`,
      }
    },
    topHeightSpace(): number {
      return tabsHeight + headerHeight + borderHeight
    },
    selectedCategoryIndex(): number {
      return AchievementSelectorStateStore.getAchievementIndex.categoryIndex
    },
    selectedKindIndex(): number {
      return AchievementSelectorStateStore.getAchievementIndex.kindIndex
    },
    group(): Group<CompletedAchievement>[] | null {
      const achievementKind =
        AchievementStore.getAchievementKinds[this.selectedKindIndex]
      if (!achievementKind) return null

      const achievementCategory =
        achievementKind.achievementCategories[this.selectedCategoryIndex]

      return achievementCategory ? achievementCategory.group : null
    },
    achievementKind(): AchievementKind<CompletedAchievement> {
      return AchievementStore.getAchievementKinds[this.selectedKindIndex]
    },
  },
  methods: {
    getGroupElementId(groupIndex: number): string {
      return `${this.achievementKind.key}_${groupIndex}`
    },
    async fetchAcievementKindByKey(key: keyof typeof KIND) {
      // AchievementStore.fetchAcievementKindByKeyの最後にsyncAchievementByKeyを入れると、Store同士で二重参照になってしまうため、mixinsでこの一連の処理を行うように
      await AchievementStore.fetchAcievementKindByKey(key)
      CharacterInfoStore.syncAchievementKindByKey(key)
    },

    async fetchAcievementCategoryById(categoryId: string) {
      // AchievementStore.fetchAcievementKindByKeyの最後にsyncAchievementByKeyを入れると、Store同士で二重参照になってしまうため、mixinsでこの一連の処理を行うように
      await AchievementStore.fetchAchievementCategoryById(categoryId)
      if (
        AchievementStore.getAchievementKinds[this.selectedKindIndex]
          .achievementCategories[this.selectedCategoryIndex].group.length > 0
      ) {
        CharacterInfoStore.syncAchievementCategoryById(categoryId)
      }
    },

    async getAchievementByTitle(key: keyof typeof KIND, title: string) {
      await this.fetchAcievementKindByKey(key)
      return AchievementStore.getAchievementByTitle(key, title)
    },
  },
})
