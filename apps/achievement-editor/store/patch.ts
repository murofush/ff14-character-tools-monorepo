import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { Patch, LocalError } from '@murofush/forfan-common-package/lib/types'
import {
  getPatchDataFromCloudStorage,
  jsonFilePath,
} from '@murofush/forfan-common-package/lib/function'
import { PATCH_PATH } from '@murofush/forfan-common-package/lib/const'
import { $axios } from '~/utils/api'

@Module({
  name: 'patch',
  stateFactory: true,
  namespaced: true,
})
export default class PatchModule extends VuexModule {
  private patches: Patch[] = []
  private isLoaded: boolean = false

  public get getPatches() {
    return this.patches
  }

  @Mutation
  setPatches(patches: Patch[]) {
    this.patches = patches
  }

  @Mutation
  loaded() {
    this.isLoaded = true
  }

  @Action
  async postPatches(patches: Patch[]) {
    try {
      await $axios.$post('/api/save_text', {
        text: JSON.stringify(patches, null, '\t'),
        path: jsonFilePath(PATCH_PATH),
      })
    } catch (error: any) {
      return { key: 'post_firebase_error', value: error } as LocalError
    }
    this.setPatches(patches)
  }

  @Action({ rawError: true })
  async fetchPatches() {
    if (!this.isLoaded) {
      const patches = await getPatchDataFromCloudStorage()
      patches.forEach((patch, index) => {
        patches[index].date = new Date(patch.date)
      })

      this.loaded()
      this.setPatches(patches)
    }
  }

  // @Action
  // async nuxtServerInit(context: Context) {
  //   await this.fetchPatches()
  // }
}
