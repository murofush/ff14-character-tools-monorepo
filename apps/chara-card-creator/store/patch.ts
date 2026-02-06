import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { Patch } from '@murofush/forfan-common-package/lib/types'
import { getPatchDataFromCloudStorage } from '@murofush/forfan-common-package/lib/function'
@Module({
  name: 'patch',
  stateFactory: true,
  namespaced: true,
})
export default class PatchModule extends VuexModule {
  private patches: Patch[] = []
  private isLoaded = false

  public get getPatches() {
    return this.patches
  }

  public get getLatestPatch(): Patch | undefined {
    return this.patches[this.patches.length - 1]
  }

  @Mutation
  setPatches(patches: Patch[]) {
    this.patches = patches
  }

  @Mutation
  loaded() {
    this.isLoaded = true
  }

  @Action({ rawError: true })
  async fetchPatches() {
    if (!this.isLoaded) {
      const patches = await getPatchDataFromCloudStorage()
      this.loaded()
      this.setPatches(patches)
    }
  }

  @Action({ rawError: true })
  async nuxtServerInit() {
    await this.fetchPatches()
  }
}
