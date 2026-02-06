/**
 * Middleware経由だと初回起動時にlocalStorageを参照したいAchievementStoreのデータ取得に不備があるのでMixin経由でMiddlewareライクな処理を行う
 * 参考：https://github.com/nuxt/nuxt.js/issues/2653#issuecomment-414551760
 */
import {
  LEVEL_CAP,
  LIMITED_LEVEL_CAP,
} from '@murofush/forfan-common-package/lib/const'
import { getJobSubImagePath } from '@murofush/forfan-common-package/lib/function'
import Vue from 'vue'
import { CharacterInfoStore } from '~/store'

export default Vue.extend({
  computed: {
    tankWithLevel(): JobWithLevel[] {
      const tankInfo = CharacterInfoStore.getBattleJobWithLevel?.tankRole
      return tankInfo ? Object.values(tankInfo) : []
    },
    healerWithLevel(): JobWithLevel[] {
      const healerInfo = CharacterInfoStore.getBattleJobWithLevel?.healerRole
      return healerInfo ? Object.values(healerInfo) : []
    },
    dpsWithLevel(): JobWithLevel[] {
      const dpsRolesInfo = CharacterInfoStore.getBattleJobWithLevel?.dpsRole
      if (!dpsRolesInfo) return []
      let dpsInfo: JobWithLevel[] = []
      dpsInfo = dpsInfo.concat(Object.values(dpsRolesInfo.meleeDps))
      dpsInfo = dpsInfo.concat(Object.values(dpsRolesInfo.physicalRangedDps))
      dpsInfo = dpsInfo.concat(Object.values(dpsRolesInfo.magicalRangedDps))
      dpsInfo = dpsInfo.concat(Object.values(dpsRolesInfo.limitedDps))
      console.log(dpsInfo)
      return dpsInfo
    },
    crafterWithLevel(): JobWithLevel[] {
      const crafterInfo = CharacterInfoStore.getCraftJobWithLevel
      return crafterInfo ? Object.values(crafterInfo) : []
    },
    gathererWithLevel(): JobWithLevel[] {
      const gathererInfo = CharacterInfoStore.getGathererJobWithLevel
      return gathererInfo ? Object.values(gathererInfo) : []
    },
  },
  methods: {
    checkClass(job: JobWithLevel): IClassWithLevel {
      if (job.level < 30 && !!job.sourceClass) {
        return {
          name: job.sourceClass.name,
          path: job.sourceClass.path,
          level: job.level,
        } as IClassWithLevel
      }
      return {
        name: job.name,
        path: job.path,
        level: job.level,
      } as IClassWithLevel
    },
    getImagePath(job: JobWithLevel) {
      const classObject = this.checkClass(job)
      return getJobSubImagePath(classObject.path)
    },
    isLevelMax(job: JobWithLevel) {
      if (
        (job.name !== '青魔道士' && job.level >= LEVEL_CAP) ||
        (job.name === '青魔道士' && job.level >= LIMITED_LEVEL_CAP)
      ) {
        return true
      }
    },
  },
})
