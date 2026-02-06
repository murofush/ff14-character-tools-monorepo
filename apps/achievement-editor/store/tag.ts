import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { Tag, LocalError } from '@murofush/forfan-common-package/lib/types'
import {
  getTagDataFromCloudStorage,
  jsonFilePath,
} from '@murofush/forfan-common-package/lib/function'
import { TAG_PATH } from '@murofush/forfan-common-package/lib/const'
import { $axios } from '~/utils/api'

@Module({
  name: 'tag',
  stateFactory: true,
  namespaced: true,
})
export default class TagModule extends VuexModule {
  private tags: Tag[] = []
  private isLoaded: boolean = false

  public get getTags() {
    return this.tags
  }

  get isLoading() {
    return this.isLoaded
  }

  @Mutation
  async postTags(tags: Tag[]) {
    this.tags = tags
    try {
      await $axios.$post('/api/save_text', {
        text: JSON.stringify(tags, null, '\t'),
        path: jsonFilePath(TAG_PATH),
      })
    } catch (error: any) {
      return { key: 'post_firebase_error', value: error } as LocalError
    }
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
    if (!this.isLoading) {
      const tags = await getTagDataFromCloudStorage()
      this.loaded()
      this.setTags(tags)
    }
  }
}
