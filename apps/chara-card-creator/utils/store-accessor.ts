import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import Tag from '~/store/tag'
import Patch from '~/store/patch'
import Achievement from '~/store/achievement'
import SelectedCharaInfo from '~/store/selectedCharaInfo'
import AchievementSelectorState from '~/store/achievementSelectorState'
import CharacterInfo from '~/store/characterInfo'

let TagStore: Tag
let PatchStore: Patch
let AchievementStore: Achievement
let SelectedCharaInfoStore: SelectedCharaInfo
let AchievementSelectorStateStore: AchievementSelectorState
let CharacterInfoStore: CharacterInfo
function initialiseStores(store: Store<any>): void {
  TagStore = getModule(Tag, store)
  PatchStore = getModule(Patch, store)
  AchievementStore = getModule(Achievement, store)
  SelectedCharaInfoStore = getModule(SelectedCharaInfo, store)
  AchievementSelectorStateStore = getModule(AchievementSelectorState, store)
  CharacterInfoStore = getModule(CharacterInfo, store)
}

export {
  initialiseStores,
  TagStore,
  PatchStore,
  AchievementStore,
  SelectedCharaInfoStore,
  AchievementSelectorStateStore,
  CharacterInfoStore,
}
