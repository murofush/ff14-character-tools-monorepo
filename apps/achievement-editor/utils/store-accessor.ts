/* eslint-disable import/no-mutable-exports */
import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import Tag from '~/store/tag'
import Patch from '~/store/patch'
import Auth from '~/store/auth'
import Achievement from '~/store/achievement'

let TagStore: Tag
let AuthStore: Auth
let PatchStore: Patch
let AchievementStore: Achievement
function initialiseStores(store: Store<any>): void {
  TagStore = getModule(Tag, store)
  AuthStore = getModule(Auth, store)
  PatchStore = getModule(Patch, store)
  AchievementStore = getModule(Achievement, store)
}

export { initialiseStores, TagStore, AuthStore, PatchStore, AchievementStore }
