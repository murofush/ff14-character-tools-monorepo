import { ActionTree, Store } from 'vuex'
import { ActionContext } from 'vuex/types'
import { Context } from '@nuxt/types'
import {
  initialiseStores,
  PatchStore,
  TagStore,
  AchievementStore,
} from '~/utils/store-accessor'
const initializer = (store: Store<any>) => initialiseStores(store)
export const plugins = [initializer]
export * from '~/utils/store-accessor'

// RootStateを追加
export const state = () => ({})
export type RootState = ReturnType<typeof state>

// Rootのactionsを追加
export const actions: ActionTree<any, any> = {
  nuxtServerInit: async (
    _ActionContext: ActionContext<RootState, RootState>,
    _Context: Context
  ) => {
    // nuxtServerInitの処理
    await Promise.all([
      TagStore.fetchTags(),
      PatchStore.fetchPatches(),
      AchievementStore.fetchAchievements(),
    ])
  },
}
