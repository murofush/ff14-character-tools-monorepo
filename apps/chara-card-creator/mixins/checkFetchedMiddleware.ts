/**
 * Middleware経由だと初回起動時にlocalStorageを参照したいAchievementStoreのデータ取得に不備があるのでMixin経由でMiddlewareライクな処理を行う
 * 参考：https://github.com/nuxt/nuxt.js/issues/2653#issuecomment-414551760
 */
import Vue from 'vue'
import { CharacterInfoStore } from '~/store'
import { isResponseCharacterData } from '~/common/function'
export default Vue.extend({
  mounted() {
    if (
      !(
        CharacterInfoStore.getResponseData &&
        isResponseCharacterData(CharacterInfoStore.getResponseData)
      )
    ) {
      this.$router.replace('/')
    }
  },
})
