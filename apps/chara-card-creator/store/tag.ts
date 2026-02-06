import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { Tag } from '@murofush/forfan-common-package/lib/types'
import { getTagDataFromCloudStorage } from '@murofush/forfan-common-package/lib/function'

@Module({
  name: 'tag',
  stateFactory: true,
  namespaced: true,
})
export default class TagModule extends VuexModule {
  private tags: Tag[] = []
  private isLoaded = false

  public get getTags() {
    return this.tags
  }

  get isloaded() {
    return this.isLoaded
  }

  @Mutation
  setTags(tags: Tag[]) {
    this.tags = tags
  }

  @Mutation
  loaded() {
    this.isLoaded = true
  }

  @Action({ rawError: true })
  async fetchTags() {
    if (!this.isLoaded) {
      const tags = await getTagDataFromCloudStorage()
      this.loaded()
      this.setTags(tags)
    }
  }

  @Action({ rawError: true })
  async nuxtServerInit() {
    await this.fetchTags()
  }
}
