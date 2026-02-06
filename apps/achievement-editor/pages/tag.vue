<template>
  <v-row no-gutters class="text-center">
    <v-col cols="12">
      <h1>
        タグ
        <v-icon v-show="isUpdated" color="green">fas fa-sync-alt</v-icon>
        <v-btn fab small class="ml-3 d-inline" @click="saveTag"
          ><v-icon>fas fa-save</v-icon></v-btn
        >
      </h1>
    </v-col>
    <v-col cols="12">
      <v-card class="mb-2">
        <v-card-text>
          <v-row no-gutters class="text-left">
            <v-col cols="12">
              <label class="caption">新規タグ作成</label>
            </v-col>
            <v-col cols="auto">
              <v-text-field
                v-model.number="tagId"
                class="mr-3"
                type="number"
                label="タグID"
                :error-messages="tagIdErrors"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-text-field
                v-model="tagName"
                class="mr-3"
                label="タグ名"
                :error-messages="tagNameErrors"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-select
                v-model="tagTargetVersion"
                :items="TARGET_VERSIONS"
                item-text="name"
                item-value="version"
                label="対象バージョン"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="tagIconName"
                class="mr-3"
                label="ファイル名（ファイルアップロード機構つくりたい）"
                :error-messages="tagIconNameErrors"
              ></v-text-field>
            </v-col>
            <v-col cols="auto">
              <v-btn @click="addTag">追加</v-btn>
            </v-col>
          </v-row>
          <v-row no-gutters class="text-left">
            <v-col cols="12">
              <label class="caption"> リリース後は使わないように。 </label>
            </v-col>
            <v-col cols="auto">
              <v-checkbox
                v-model="isForceTagUpdate"
                label="タグID強制変更"
                color="white"
                background-color="red"
              >
              </v-checkbox>
            </v-col>
            <v-col class="mr-3" cols="auto" align-self="center">
              <p class="ml-3">
                タグ更新後、アチーブメント更新保存
                <v-icon v-show="isAchievementUpdated" color="green">
                  fas fa-sync-alt
                </v-icon>
                <v-btn
                  fab
                  small
                  class="ml-3 d-inline"
                  :disabled="!isAchievementUpdated"
                  @click="saveAchievement"
                  ><v-icon>fas fa-save</v-icon>
                </v-btn>
              </p>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <v-switch v-model="insertable" label="挿入領域表示"></v-switch>
    <client-only>
      <v-col cols="12">
        <draggable
          class="dragArea"
          tag="v-expansion-panels"
          :list="editTags"
          :group="{ name: 'tag' }"
          :component-data="{ attrs: { multiple: true } }"
          @change="sortTag()"
        >
          <v-expansion-panel
            v-for="(tag, index) in editTags"
            :key="tag.id"
            :color="`rgb(${baseColorVal},${baseColorVal},${baseColorVal})`"
            class="mb-2 text-left"
            outlined
          >
            <v-expansion-panel-header>
              <h2 class="tag_title">
                <image-icon
                  :icon-path="tag.iconPath"
                  :rounded="!tag.flatIcon"
                ></image-icon>
                {{ tag.id }}. {{ tag.name }}
                <v-btn icon class="ml-3" @click="deleteTag(index)"
                  ><v-icon>fas fa-trash</v-icon></v-btn
                >
              </h2>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <nested-tag-draggable
                :insertable="insertable"
                :tags="editTags[index].tags"
                :index="index"
                :color-val="baseColorVal + 12"
                @delete="deleteNestedTag"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </draggable>
      </v-col>
    </client-only>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
import { diff } from 'deep-object-diff'
import rfdc from 'rfdc'
import { required, not, minValue } from 'vuelidate/lib/validators'
import flat from 'flat'
import draggable from 'vuedraggable'
import {
  EditAchievement,
  Tag,
  FetchedAchievementKind,
} from '@murofush/forfan-common-package/lib/types'
import { isLocalError } from '@murofush/forfan-common-package/lib/function'
import { TARGET_VERSIONS } from '@murofush/forfan-common-package/lib/const'
import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
import nestedTagDraggable from '~/components/nestedTagDraggable.vue'
import validationMixin from '~/mixins/validation'
import { TagStore, AchievementStore } from '~/store'

const clone = rfdc()

interface flattenTagObj {
  [key: string]: any
}

export default Vue.extend({
  components: {
    draggable,
    nestedTagDraggable,
  },
  mixins: [validationMixin],
  asyncData() {
    const achievementDataList = AchievementStore.getAchievementDataList
    return {
      achievementDataList: clone(achievementDataList),
      baseAchievementDataList: clone(achievementDataList),
    }
  },
  validations: {
    tagId: {
      required,
      notsame: not((val: any, model: any) => {
        return (
          !model.isForceTagUpdate &&
          !!model.getTagIds().find((existVal: number) => {
            // eslint-disable-next-line eqeqeq
            return existVal == val
          })
        )
      }),
      minValue: minValue(1),
    },
    tagName: {
      required,
      notsame: not((val: any, model: any) => {
        return (
          !model.isForceTagUpdate &&
          !!model.getTagNames().find((existVal: number) => {
            // eslint-disable-next-line eqeqeq
            return existVal === val
          })
        )
      }),
    },
    tagIconName: {
      required,
    },
  },
  data() {
    return {
      isForceTagUpdate: false,
      insertable: true,
      baseColorVal: 36,
      tagId: 0 as number,
      tagImageSize: 30,
      tagName: '',
      tagTargetVersion: 0,
      tagIconName: 'tag/img/',
      // TODO: このFormを作る。
      tagColor: '',
      tagIsFrameEnabled: false,
      achievementDataList: [] as FetchedAchievementKind<EditAchievement>[],
      baseAchievementDataList: [] as FetchedAchievementKind<EditAchievement>[],
      editTags: clone(TagStore.getTags),
      baseTags: clone(TagStore.getTags),
      isUpdated: false,
      isAchievementUpdated: false,
      editTagOverlay: false,
    }
  },
  computed: {
    TARGET_VERSIONS() {
      return TARGET_VERSIONS
    },
    deepcopyTags(): Tag[] {
      return clone(this.editTags)
    },
    tagIdErrors() {
      const errors: string[] = []
      if (!this.$v.tagId.$dirty) return errors
      !this.$v.tagId.required && errors.push('必須です')
      !this.$v.tagId.notsame && errors.push('IDが重複してます')
      !this.$v.tagId.minValue && errors.push('1以上を設定してください')
      return errors
    },
    tagNameErrors() {
      const errors: string[] = []
      if (!this.$v.tagName.$dirty) return errors
      !this.$v.tagName.required && errors.push('必須です')
      !this.$v.tagName.notsame && errors.push('名前が重複してます')
      return errors
    },
    tagIconNameErrors() {
      const errors: string[] = []
      if (!this.$v.tagIconName.$dirty) return errors
      !this.$v.tagIconName.required && errors.push('必須です')
      return errors
    },
  },
  watch: {
    deepcopyTags: {
      handler(val: TemplateStringsArray[]) {
        const vm = this
        const diffObj = diff(val, vm.baseTags)
        this.isUpdated = Object.keys(diffObj).length > 0
      },
      deep: true,
    },
  },
  mounted() {
    console.log('editedTag', this.editTags)
    this.tagId = this.getLatestTagId() + 1
  },
  methods: {
    addTag() {
      this.$v.tagId.$touch()
      this.$v.tagName.$touch()
      // this.$v.tagIconName.$touch()
      if (this.$v.tagId.$invalid || this.$v.tagName.$invalid) {
        return
      }
      const tag: Tag = {
        id: this.tagId,
        name: this.tagName,
        targetVersion: this.tagTargetVersion,
        iconPath: this.tagIconName,
        flatIcon: false,
        tags: [],
      }
      if (this.isForceTagUpdate) {
        this.forceInsertTagID()
      }
      this.editTags.push(tag)

      this.$v.$reset()
      this.tagId = this.getLatestTagId() + 1
      this.tagIconName = 'tag/img/'
      this.tagName = ''
      this.tagTargetVersion = 0
    },
    async saveTag() {
      const error = await TagStore.postTags(clone(this.editTags))
      if (isLocalError(error)) {
        this.$nuxt.$emit(OUTPUT_SNACKBAR, {
          text: error.value,
          color: 'error',
        })
        return
      }
      this.baseTags = clone(this.editTags)
      this.isUpdated = false
    },
    saveAchievement() {
      this.baseAchievementDataList = clone(this.achievementDataList)
      this.isAchievementUpdated = false
    },
    forEachFlattenTagValue(cb: (key: string, value: any) => void) {
      const flatTags: flattenTagObj = flat.flatten(this.editTags)
      if (flatTags) {
        Object.entries(flatTags).forEach(([key, value]) => {
          cb(key, value)
        })
      }
    },
    getTagNames(): string[] {
      const names: string[] = []
      this.forEachFlattenTagValue((key, value) => {
        if (key.includes('name') && typeof value === 'string') {
          names.push(value)
        }
      })
      return names
    },
    getTagIds(): number[] {
      const ids: number[] = []
      this.forEachFlattenTagValue((key, value) => {
        if (key.includes('id')) {
          ids.push(value)
        }
      })
      return ids
    },
    getLatestTagId() {
      const ids = this.getTagIds()
      return Math.max(...ids) >= 0 ? Math.max(...ids) : 0
    },
    // !important 以下、この機能はリリース後には使わないこと。
    forceInsertTagID() {
      this.updateAchievementTagId((tagId) => {
        if (tagId >= this.tagId) {
          tagId++
        }
        return tagId
      })
      this.editTags = this.updateTagId(this.editTags, (tag) => {
        if (tag.id >= this.tagId) {
          tag.id++
        }
        return tag
      })
      this.checkUpdateAchievement()
    },
    deleteNestedTag(tagIndexStack: number[]) {
      const removeById = (tag: Tag, tagId: number) => {
        tag.tags = tag.tags
          .filter(function (child) {
            return child.id !== tagId
          })
          .map(function (child) {
            return removeById(child, tagId)
          })
        return tag
      }
      let tags = this.editTags
      for (let i = tagIndexStack.length - 1; i > 0; i--) {
        tags = tags[tagIndexStack[i]].tags
      }
      const deletedTag = tags[tagIndexStack[0]]

      if (deletedTag.tags && deletedTag.tags.length > 0) {
        deletedTag.tags.forEach((nestedTag) => {
          this.editTags.push(nestedTag)
        })
      }
      this.editTags[tagIndexStack[tagIndexStack.length - 1]] = removeById(
        this.editTags[tagIndexStack[tagIndexStack.length - 1]],
        deletedTag.id
      )
      // !important 以下、この機能はリリース後には使わないこと。
      if (this.isForceTagUpdate) {
        this.updateAchievementTagId(
          (tagId) => {
            if (tagId > deletedTag.id) {
              tagId--
            }
            return tagId
          },
          (tagId) => {
            return tagId !== deletedTag.id
          }
        )
        this.updateTagId(this.editTags, (tag) => {
          if (tag.id >= deletedTag.id) {
            tag.id--
          }
          return tag
        })
        this.checkUpdateAchievement()
      }
      this.sortTag()
      // ここにForceDelete関係の処理を確認
      console.log(deletedTag)
    },
    deleteTag(tagIndex: number) {
      const deletedTag = this.editTags[tagIndex]

      if (deletedTag.tags && deletedTag.tags.length > 0) {
        deletedTag.tags.forEach((nestedTag) => {
          this.editTags.push(nestedTag)
        })
      }

      this.editTags.splice(tagIndex, 1)
      // !important 以下、この機能はリリース後には使わないこと。
      if (this.isForceTagUpdate) {
        this.updateAchievementTagId(
          (tagId) => {
            if (tagId > deletedTag.id) {
              tagId--
            }
            return tagId
          },
          (tagId) => {
            return tagId !== deletedTag.id
          }
        )
        this.updateTagId(this.editTags, (tag) => {
          if (tag.id >= deletedTag.id) {
            tag.id--
          }
          return tag
        })
        this.checkUpdateAchievement()
      }
      this.sortTag()
    },
    sortTag() {
      this.editTags.sort((a, b) => {
        const aIndex = a.id ? a.id : -1
        const bIndex = b.id ? b.id : -1
        return aIndex - bIndex
      })
    },
    updateTagId(tags: Tag[], cbFn: (tag: Tag) => Tag) {
      tags = tags.map(cbFn)
      tags.forEach((tag, index) => {
        if (tag.tags.length > 0) {
          tags[index].tags = this.updateTagId(tag.tags, cbFn)
        }
      })
      return tags
    },
    updateAchievementTagId(
      mapCbFn: (tagId: number) => number,
      filterCbFn?: (tagId: number) => boolean
    ) {
      this.achievementDataList.forEach((achievementVal, achievementIndex) => {
        achievementVal.achievementCategories.forEach((listVal, listIndex) => {
          // Uncategolized TagID
          listVal.ungroup.forEach((uncategorizedVal, uncategorizedIndex) => {
            if (uncategorizedVal.tagIds && uncategorizedVal.tagIds.length > 0) {
              let updatedArray = uncategorizedVal.tagIds
              if (filterCbFn) {
                updatedArray = updatedArray.filter(filterCbFn)
              }
              updatedArray = updatedArray.map(mapCbFn)
              this.achievementDataList[achievementIndex].achievementCategories[
                listIndex
              ].ungroup[uncategorizedIndex].tagIds = updatedArray
            }
          })
          // Categorized
          listVal.group.forEach((categorizedVal, categorizedIndex) => {
            // Achievement TagID
            categorizedVal.data.forEach((dataVal, dataIndex) => {
              if (dataVal.tagIds && dataVal.tagIds.length > 0) {
                let updatedArray = dataVal.tagIds
                if (filterCbFn) {
                  updatedArray = updatedArray.filter(filterCbFn)
                }
                updatedArray = updatedArray.map(mapCbFn)
                this.achievementDataList[
                  achievementIndex
                ].achievementCategories[listIndex].group[categorizedIndex].data[
                  dataIndex
                ].tagIds = updatedArray
              }
            })
          })
        })
      })
    },
    checkUpdateAchievement() {
      const diffObj = diff(
        this.achievementDataList,
        this.baseAchievementDataList
      )
      console.log(diffObj)
      this.isAchievementUpdated = Object.keys(diffObj).length > 0
    },
  },
})
</script>
<style lang="scss" scoped>
.tag_icon {
  object-fit: contain;
}
.tag_title {
}
</style>
