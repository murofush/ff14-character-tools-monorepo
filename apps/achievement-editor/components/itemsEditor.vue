<template>
  <div v-if="!!achievementKind">
    <v-row class="text-center">
      <v-col cols="12">
        <h1>
          <span class="caption"> {{ achievementKind.kind.id }}:</span>
          {{ achievementKind.kind.name }}
          <v-btn fab small class="ml-3 d-inline" @click="saveCategoryTable()"
            ><v-icon>fas fa-save</v-icon></v-btn
          >
        </h1>
      </v-col>
      <v-col
        v-for="(list, listIndex) in achievementKind.achievementCategories"
        :key="listIndex"
        cols="12"
      >
        <h2 class="mb-1">
          {{ list.title }}
          <span class="caption"> {{ list.path }}</span>
          <v-icon v-show="isUpdatedGroupByIndex(listIndex)" color="green"
            >fas fa-sync-alt</v-icon
          >
          <v-btn
            fab
            small
            class="ml-3 d-inline"
            :disabled="!isUpdatedGroupByIndex(listIndex)"
            @click="saveCategoryGroupById(listIndex)"
            ><v-icon>fas fa-save</v-icon></v-btn
          >
        </h2>
        <v-card class="mb-3">
          <v-expansion-panels multiple>
            <v-expansion-panel>
              <v-expansion-panel-header>
                カテゴリーグループ作成
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <groupCreator
                  v-model="achievementKind"
                  @groupCreate="groupCreate($event, listIndex)"
                />
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel expand>
              <v-expansion-panel-header>
                新規アチーブ作成
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <achievementCreator
                  :category-key="achievementKind.key"
                  :group="list.title"
                  @output_snackbar="outputSnackbar($event)"
                  @achievement_create="achievementCreate($event, listIndex)"
                />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-card>
              <v-expansion-panels multiple>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <div>
                      未分類
                      <v-icon
                        v-show="
                          achievementKind.achievementCategories[listIndex]
                            .ungroup.length > 0
                        "
                        class="ml-3"
                        color="red"
                        >fas fa-exclamation</v-icon
                      >
                    </div>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-divider class="xy-2" />
                    <draggable
                      :list="
                        achievementKind.achievementCategories[listIndex].ungroup
                      "
                      tag="v-row"
                      group="achievement"
                      @change="uncategorySort(listIndex)"
                    >
                      <v-col
                        v-for="(data, dataIndex) in achievementKind
                          .achievementCategories[listIndex].ungroup"
                        :key="dataIndex"
                        cols="12"
                        sm="6"
                      >
                        <achievementCard :achievement="data" />
                      </v-col>
                    </draggable>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card elevation="2">
              <draggable
                :list="achievementKind.achievementCategories[listIndex].group"
                tag="v-expansion-panels"
                :component-data="{ attrs: { multiple: true } }"
                group="category"
              >
                <v-expansion-panel
                  v-for="(item, categorizedIndex) in achievementKind
                    .achievementCategories[listIndex].group"
                  :key="categorizedIndex"
                >
                  <v-expansion-panel-header>
                    <v-row no-gutters>
                      <v-col cols="12">
                        {{ item.title }}
                        <v-btn
                          icon
                          class="ml-1"
                          @click.stop="
                            editCategorizedText(listIndex, categorizedIndex)
                          "
                        >
                          <v-icon>fas fa-edit</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          class="ml-1"
                          @click.stop="
                            deleteCategory(listIndex, categorizedIndex)
                          "
                        >
                          <v-icon>fas fa-trash</v-icon>
                        </v-btn>
                      </v-col>
                      <v-col class="my-2" cols="12">
                        <v-divider></v-divider>
                      </v-col>
                      <v-col cols="12">
                        <span class="caption">タグ：</span>
                        <v-chip
                          v-for="tagId in getGroupTagIds(
                            listIndex,
                            categorizedIndex
                          )"
                          :key="tagId"
                          :color="getTagById(tagId).color"
                          class="mr-1"
                        >
                          <image-icon
                            :icon-path="getTagById(tagId).iconPath"
                            :image-size="24"
                            :rounded="!getTagById(tagId).flatIcon"
                            class="mr-1"
                          ></image-icon>
                          {{ getTagById(tagId).name }}
                        </v-chip>
                        <v-btn
                          icon
                          class="ml-1"
                          @click.stop="
                            editGroupTag(listIndex, categorizedIndex)
                          "
                        >
                          <v-icon>fas fa-tags</v-icon>
                        </v-btn>
                      </v-col>

                      <v-col class="my-2" cols="12">
                        <v-divider></v-divider>
                      </v-col>
                      <v-col cols="6">
                        <span class="caption">対応パッチ：</span>
                        <v-chip
                          v-if="
                            getGroupPatchByPatchId(listIndex, categorizedIndex)
                          "
                          >{{
                            getGroupPatchByPatchId(listIndex, categorizedIndex)
                              .number
                          }}
                          -
                          {{
                            getGroupPatchByPatchId(listIndex, categorizedIndex)
                              .subtitle
                          }}</v-chip
                        >
                        <v-btn
                          icon
                          class="ml-1"
                          @click.stop="
                            editGroupPatchOfPatchId(listIndex, categorizedIndex)
                          "
                        >
                          <v-icon>fas fa-calendar-day</v-icon>
                        </v-btn>
                      </v-col>
                      <v-col cols="6">
                        <span class="caption">緩和パッチ：</span>
                        <v-chip
                          v-if="
                            getGroupPatchByAdjustmentPatchId(
                              listIndex,
                              categorizedIndex
                            )
                          "
                          >{{
                            getGroupPatchByAdjustmentPatchId(
                              listIndex,
                              categorizedIndex
                            ).number
                          }}
                          -
                          {{
                            getGroupPatchByAdjustmentPatchId(
                              listIndex,
                              categorizedIndex
                            ).subtitle
                          }}</v-chip
                        >
                        <v-btn
                          icon
                          class="ml-1"
                          @click.stop="
                            editGroupPatchOfAdjustmentPatchId(
                              listIndex,
                              categorizedIndex
                            )
                          "
                        >
                          <v-icon>fas fa-calendar-day</v-icon>
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-divider />
                    <draggable
                      class="mt-2"
                      :list="
                        achievementKind.achievementCategories[listIndex].group[
                          categorizedIndex
                        ].data
                      "
                      tag="v-row"
                      group="achievement"
                      @change="categorySort(listIndex, categorizedIndex)"
                    >
                      <v-col
                        v-for="(data, dataIndex) in achievementKind
                          .achievementCategories[listIndex].group[
                          categorizedIndex
                        ].data"
                        :key="dataIndex"
                        cols="12"
                        sm="6"
                      >
                        <achievementCard
                          :achievement="data"
                          @tag_edit="
                            editAchievementTag(
                              listIndex,
                              categorizedIndex,
                              dataIndex
                            )
                          "
                          @adjustment_patch_edit="
                            editAchievementPatchOfAdjustmentPatchId(
                              listIndex,
                              categorizedIndex,
                              dataIndex
                            )
                          "
                          @patch_edit="
                            editAchievementPatchOfPatchId(
                              listIndex,
                              categorizedIndex,
                              dataIndex
                            )
                          "
                        />
                      </v-col>
                    </draggable>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </draggable>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- タグ -->
    <v-dialog v-model="editTagOverlay" @click:outside="closeOverlay">
      <v-card v-if="editTagOverlay" class="v-card-tag-editor">
        <v-card-title class="text-center">
          {{ editedTitle }}
          <v-btn
            small
            icon
            class="white--text ml-2"
            color="red"
            @click="closeOverlay"
          >
            <v-icon>fas fa-times</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <tag-selector v-model="editTagIds"></tag-selector>
        </v-card-text>
        <v-card-actions>
          <v-col cols="12">
            <v-row justify="end">
              <v-col cols="auto">
                <v-btn color="primary" @click="confirmTagSelected">決定</v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- パッチ修正 -->
    <v-dialog v-model="editPatchOverlay" @click:outside="closeOverlay">
      <v-card v-if="editPatchOverlay" class="v-card-tag-editor">
        <v-card-title class="text-center">
          {{ editedTitle }} - {{ editPatchType }}
          <v-btn
            small
            icon
            class="white--text ml-2"
            color="red"
            @click="closeOverlay"
          >
            <v-icon>fas fa-times</v-icon>
          </v-btn>
          <v-btn color="primary" @click="confirmPatchSelected">決定</v-btn>
        </v-card-title>
        <v-card-text>
          <patch-selector v-model="editPatch"></patch-selector>
        </v-card-text>
        <v-card-actions>
          <v-col cols="12">
            <v-row justify="end">
              <v-col cols="auto">
                <v-btn color="primary" @click="confirmPatchSelected"
                  >決定</v-btn
                >
              </v-col>
            </v-row>
          </v-col>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- テキスト編集 -->
    <v-dialog
      v-model="editCategorizeTitleOverlay"
      @click:outside="closeOverlay"
    >
      <v-card v-if="editCategorizeTitleOverlay" class="v-card-tag-editor">
        <v-card-title class="text-center">
          {{ editedTitle }}
          <v-btn
            small
            icon
            class="white--text ml-2"
            color="red"
            @click="closeOverlay"
          >
            <v-icon>fas fa-times</v-icon>
          </v-btn>
          <v-btn color="primary" @click="confirmEditText">決定</v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="editTextVal"> </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-col cols="12">
            <v-row justify="end">
              <v-col cols="auto">
                <v-btn color="primary" @click="confirmEditText">決定</v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import draggable from 'vuedraggable'
import { diff } from 'deep-object-diff'
import rfdc from 'rfdc'
import {
  Kind,
  AchievementKind,
  Group,
  EditAchievement,
  Patch,
} from '@murofush/forfan-common-package/lib/types'
import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
import { isLocalError } from '@murofush/forfan-common-package/lib/function'

import { AchievementStore } from '~/store'
import tagSelector from '~/components/tagSelector.vue'
import groupCreator from '~/components/groupCreator.vue'
import achievementCreator from '~/components/achievementCreator.vue'
import { TagMixin, PatchMixin } from '@murofush/forfan-common-vue'
import achievementCard from '~/components/achievementCard.vue'

import { TagStore, PatchStore } from '~/store'

const clone = rfdc()

type PatchType = 'adjustmentPatchId' | 'patchId' | null

interface resetableStatus {
  editTagOverlay: boolean
  editPatchOverlay: boolean
  editCategorizeTitleOverlay: boolean
  editPatchType: PatchType
  editPatch: number
  editTagIds: number[]
  editedListIndex: number
  editedCategorizedIndex: number
  editedAchievementIndex: number
  editTextVal: string
}

const resetableStatus = (): resetableStatus => {
  return {
    // フラグを追加するたびにcomputed.isOverlayFlagEnabledにフラグを追記する。（重複防止のため）
    editTagOverlay: false,
    editPatchOverlay: false,
    editCategorizeTitleOverlay: false,
    editPatchType: null,
    editPatch: 0,
    editTagIds: [],
    editedListIndex: -1,
    editedCategorizedIndex: -1,
    editedAchievementIndex: -1,
    editTextVal: '',
  }
}

export default Vue.extend({
  components: {
    draggable,
    groupCreator,
    achievementCard,
    achievementCreator,
    tagSelector,
  },
  mixins: [TagMixin, PatchMixin],
  data(): resetableStatus & {
    baseValue: AchievementKind<EditAchievement>
    isUpdatedGroup: number[]
  } {
    return Object.assign(resetableStatus(), {
      baseValue: clone(this.value),
      isUpdatedGroup: [],
    })
  },
  props: {
    value: {
      type: Object as PropType<AchievementKind<EditAchievement>>,
      default: null,
      required: true,
    },
  },
  mounted() {
    this.achievementKind.achievementCategories.forEach((list, listIndex) => {
      for (const category of this.achievementKind.kind.categories) {
        if (list.title === category.path) {
          this.achievementKind.achievementCategories[listIndex].title =
            category.name
          this.achievementKind.achievementCategories[listIndex].path =
            category.path
        }
      }
    })
  },
  computed: {
    isOverlayFlagEnabled(): boolean {
      return (
        this.editTagOverlay ||
        this.editPatchOverlay ||
        this.editCategorizeTitleOverlay
      )
    },
    achievementKind: {
      get(): AchievementKind<EditAchievement> {
        return this.value
      },
      set(val: AchievementKind<EditAchievement>) {
        this.$emit('input', val)
      },
    },
    // DeepCopyしないとwatchで値が取得できない。
    // https://github.com/vuejs/vue/issues/2164#issuecomment-542766308

    deepcopyAchievementObjects() {
      return clone(this.value)
    },
    editedTitle(): string {
      if (this.editedListIndex !== -1 && this.editedCategorizedIndex !== -1) {
        if (this.editedAchievementIndex !== -1) {
          return this.achievementKind.achievementCategories[
            this.editedListIndex
          ].group[this.editedCategorizedIndex].data[this.editedAchievementIndex]
            .title
        }
        return this.achievementKind.achievementCategories[this.editedListIndex]
          .group[this.editedCategorizedIndex].title
      }
      return ''
    },
    selectedTagIds: {
      get(): number[] {
        if (this.editedListIndex !== -1 && this.editedCategorizedIndex !== -1) {
          if (this.editedAchievementIndex !== -1) {
            return this.achievementKind.achievementCategories[
              this.editedListIndex
            ].group[this.editedCategorizedIndex].data[
              this.editedAchievementIndex
            ].tagIds
          }
          // Group
          return this.getGroupTagIds(
            this.editedListIndex,
            this.editedCategorizedIndex
          )
        }
        return []
      },
      set(val: number[]) {
        if (this.editedListIndex !== -1 && this.editedCategorizedIndex !== -1) {
          // Achievement単体での変更
          if (this.editedAchievementIndex !== -1) {
            Vue.set(
              this.achievementKind.achievementCategories[this.editedListIndex]
                .group[this.editedCategorizedIndex].data[
                this.editedAchievementIndex
              ],
              'tagIds',
              val
            )
            return
          }
          // Achievementグループ全体での変更
          const Group =
            this.achievementKind.achievementCategories[this.editedListIndex]
              .group[this.editedCategorizedIndex].data

          const baseGroupTagIds = this.getGroupTagIds(
            this.editedListIndex,
            this.editedCategorizedIndex
          )
          const diffArray = baseGroupTagIds.filter((i) => !val.includes(i))

          Group.forEach((item, itemIndex) => {
            // 追加チェック
            const newTagids = Array.from(new Set(item.tagIds.concat(val))).sort(
              (a, b) => {
                return a - b
              }
            )
            // 削除チェック
            diffArray.forEach((diffVal) => {
              newTagids.splice(newTagids.indexOf(diffVal), 1)
            })
            Vue.set(
              this.achievementKind.achievementCategories[this.editedListIndex]
                .group[this.editedCategorizedIndex].data[itemIndex],
              'tagIds',
              newTagids
            )
          })
        }
      },
    },
    selectedPatch: {
      get(): number {
        if (this.editPatchType) {
          if (
            this.editedListIndex !== -1 &&
            this.editedCategorizedIndex !== -1
          ) {
            if (this.editedAchievementIndex !== -1) {
              return (
                (this.achievementKind.achievementCategories[
                  this.editedListIndex
                ].group[this.editedCategorizedIndex].data[
                  this.editedAchievementIndex
                ][this.editPatchType as keyof EditAchievement] as number) || 0
              )
            }
            // Group
            return this.getGroupPatch(
              this.editedListIndex,
              this.editedCategorizedIndex,
              this.editPatchType
            )
          }
        }
        return 0
      },
      set(val: number) {
        if (this.editedListIndex !== -1 && this.editedCategorizedIndex !== -1) {
          if (this.editPatchType) {
            // Achievement単体での変更
            if (this.editedAchievementIndex !== -1) {
              ;(this.achievementKind.achievementCategories[this.editedListIndex]
                .group[this.editedCategorizedIndex].data[
                this.editedAchievementIndex
              ][this.editPatchType as keyof EditAchievement] as number) = val
              return
            }
            // Achievementグループ全体での変更
            const Group =
              this.achievementKind.achievementCategories[this.editedListIndex]
                .group[this.editedCategorizedIndex].data

            Group.forEach((_, itemIndex) => {
              // 全体適用
              ;(this.achievementKind.achievementCategories[this.editedListIndex]
                .group[this.editedCategorizedIndex].data[itemIndex][
                this.editPatchType as keyof EditAchievement
              ] as number) = val
            })
          }
        }
      },
    },
    // TODO: 現状、categorized.titleのみ編集可能な状態になってるので今後追加で変更が必要なものが出てきたら、そのフォーマットにも合うように修正する。
    selectedTextVal: {
      get(): string {
        if (this.editedListIndex !== -1 && this.editedCategorizedIndex !== -1) {
          return this.achievementKind.achievementCategories[
            this.editedListIndex
          ].group[this.editedCategorizedIndex].title
        }
        return ''
      },
      set(val: string) {
        if (this.editedListIndex !== -1 && this.editedCategorizedIndex !== -1) {
          // Achievementグループ全体での変更
          this.achievementKind.achievementCategories[
            this.editedListIndex
          ].group[this.editedCategorizedIndex].title = val
        }
      },
    },
  },
  watch: {
    deepcopyAchievementObjects: {
      handler(
        val: AchievementKind<EditAchievement>
        // oldVal: AchievementKind<EditAchievement>
      ) {
        this.checkDiff(val)
        // 自動セーブを行う場合にはここを有効化する。
        // ただし、更新されるたびにリロードがかかってしまう
        // const vm = this
        // val.achievementCategories.forEach(function (p, idx) {
        //   const diffObj = diff(p, oldVal.achievementCategories[idx])
        //   if (diffObj) {
        //     await AchievementStore.postAchievementDataListByKey(
        //       vm.achievementKind.achievementCategories[idx],
        //       vm.category,
        //       idx
        //     )
        //   }
        // })
      },
      deep: true,
    },
  },
  methods: {
    getGroupPatchByAdjustmentPatchId(
      listIndex: number,
      categorizedIndex: number
    ) {
      return this.getGroupPatchByIndex(
        listIndex,
        categorizedIndex,
        'adjustmentPatchId'
      )
    },
    getGroupPatchByPatchId(listIndex: number, categorizedIndex: number) {
      return this.getGroupPatchByIndex(listIndex, categorizedIndex, 'patchId')
    },
    getGroupPatchByIndex(
      listIndex: number,
      categorizedIndex: number,
      patchType: PatchType
    ): Patch | null {
      return (this as any).getPatchByIdProcess(
        PatchStore.getPatches,
        this.getGroupPatch(listIndex, categorizedIndex, patchType)
      )
    },
    checkDiff(val: AchievementKind<EditAchievement>) {
      const vm = this
      val.achievementCategories.forEach(function (p, idx) {
        const diffObj = diff(p, vm.baseValue.achievementCategories[idx])
        if (Object.keys(diffObj).length > 0) {
          if (!vm.isUpdatedGroupByIndex(idx)) vm.isUpdatedGroup.push(idx)
        } else if (vm.isUpdatedGroupByIndex(idx)) vm.cleanUpdatedGroupById(idx)
      })
    },
    getGroupTagIds(
      tagListIndex: number,
      tagCategorizedIndex: number
    ): number[] {
      const categorizedData =
        this.achievementKind.achievementCategories[tagListIndex].group[
          tagCategorizedIndex
        ].data
      if (categorizedData.length > 0) {
        let allMatchedTagIds = categorizedData[0].tagIds
        for (let i = 1; i < categorizedData.length; i++) {
          const matchedTag: number[] = []
          allMatchedTagIds.forEach((baseTagVal) => {
            categorizedData[i].tagIds.forEach((checkTagVal) => {
              if (baseTagVal === checkTagVal) {
                matchedTag.push(checkTagVal)
              }
            })
          })
          allMatchedTagIds = matchedTag
        }
        return allMatchedTagIds
      }
      return []
    },
    getGroupPatch(
      tagListIndex: number,
      tagCategorizedIndex: number,
      patchType: PatchType
    ): number {
      const categorizedData =
        this.achievementKind.achievementCategories[tagListIndex].group[
          tagCategorizedIndex
        ].data
      if (categorizedData.length > 0) {
        const matchedPatch = categorizedData[0][
          patchType as keyof EditAchievement
        ] as number
        for (let i = 1; i < categorizedData.length; i++) {
          if (
            matchedPatch !==
            categorizedData[i][patchType as keyof EditAchievement]
          ) {
            return 0
          }
        }
        return matchedPatch || 0
      }
      return 0
    },
    editGroupTag(listIndex: number, categorizedIndex: number) {
      if (!this.isOverlayFlagEnabled) {
        this.editTagOverlay = true
        this.editedListIndex = listIndex
        this.editedCategorizedIndex = categorizedIndex
        this.editTagIds = this.selectedTagIds
      }
    },
    editAchievementTag(
      listIndex: number,
      categorizedIndex: number,
      achievementIndex: number
    ) {
      if (!this.isOverlayFlagEnabled) {
        this.editTagOverlay = true
        this.editedListIndex = listIndex
        this.editedCategorizedIndex = categorizedIndex
        this.editedAchievementIndex = achievementIndex
        this.editTagIds = this.selectedTagIds
      }
    },
    editGroupPatchOfAdjustmentPatchId(
      listIndex: number,
      categorizedIndex: number
    ) {
      this.editAchievementPatch(
        listIndex,
        categorizedIndex,
        null,
        'adjustmentPatchId'
      )
    },
    editGroupPatchOfPatchId(listIndex: number, categorizedIndex: number) {
      this.editAchievementPatch(listIndex, categorizedIndex, null, 'patchId')
    },
    editAchievementPatchOfAdjustmentPatchId(
      listIndex: number,
      categorizedIndex: number,
      achievementIndex: number
    ) {
      this.editAchievementPatch(
        listIndex,
        categorizedIndex,
        achievementIndex,
        'adjustmentPatchId'
      )
    },
    editAchievementPatchOfPatchId(
      listIndex: number,
      categorizedIndex: number,
      achievementIndex: number
    ) {
      this.editAchievementPatch(
        listIndex,
        categorizedIndex,
        achievementIndex,
        'patchId'
      )
    },
    editAchievementPatch(
      listIndex: number,
      categorizedIndex: number,
      achievementIndex: number | null,
      patchType: PatchType
    ) {
      if (!this.isOverlayFlagEnabled) {
        this.editPatchOverlay = true
        this.editedListIndex = listIndex
        this.editedCategorizedIndex = categorizedIndex
        this.editedAchievementIndex = achievementIndex ?? -1
        this.editPatchType = patchType
        this.editPatch = this.selectedPatch
      }
    },
    editCategorizedText(listIndex: number, categorizedIndex: number) {
      if (!this.isOverlayFlagEnabled) {
        this.editCategorizeTitleOverlay = true
        this.editedListIndex = listIndex
        this.editedCategorizedIndex = categorizedIndex
        this.editTextVal = this.selectedTextVal
      }
    },
    closeOverlay() {
      Object.assign(this.$data, resetableStatus())
    },
    outputSnackbar(snackbar: EmitOutputSnackbar) {
      this.$emit(OUTPUT_SNACKBAR, snackbar)
    },
    achievementCreate(response: EditAchievement, index: number) {
      ;(
        this.achievementKind as AchievementKind<EditAchievement>
      ).achievementCategories[index].ungroup.push(response)
      this.outputSnackbar({
        text: `creating achievement ${response.title}.`,
      })
    },
    groupCreate(response: EmitGroupCreator, index: number) {
      const title = (this.achievementKind as AchievementKind<EditAchievement>)
        .achievementCategories[index].title
      const group: Group<EditAchievement> = {
        title: response.title,
        data: [],
      }

      if (
        (
          this.achievementKind as AchievementKind<EditAchievement>
        ).achievementCategories[index].group.find((categorize) => {
          return categorize.title === response.title
        })
      ) {
        this.$emit(OUTPUT_SNACKBAR, {
          text: `${title} ${response.title} is already created.`,
          color: 'error',
        })
        return
      }
      ;(
        this.achievementKind as AchievementKind<EditAchievement>
      ).achievementCategories[index].group.push(group)
      this.$emit(OUTPUT_SNACKBAR, {
        text: `creating category ${title} ${response.title}.`,
      })
    },
    deleteCategory(listIndex: number, categorizeIndex: number) {
      ;(
        this.achievementKind as AchievementKind<EditAchievement>
      ).achievementCategories[listIndex].ungroup.push.apply(
        (this.achievementKind as AchievementKind<EditAchievement>)
          .achievementCategories[listIndex].ungroup,
        (this.achievementKind as AchievementKind<EditAchievement>)
          .achievementCategories[listIndex].group[categorizeIndex].data
      )
      this.uncategorySort(listIndex)
      ;(
        this.achievementKind as AchievementKind<EditAchievement>
      ).achievementCategories[listIndex].group.splice(categorizeIndex, 1)
    },
    uncategorySort(listIndex: number) {
      ;(
        this.achievementKind as AchievementKind<EditAchievement>
      ).achievementCategories[listIndex].ungroup.sort((a, b) => {
        const aIndex = a.sourceIndex ? a.sourceIndex : -1
        const bIndex = b.sourceIndex ? b.sourceIndex : -1
        // sourceIndexが-1の値は全ての一番最後に配置するように
        if (aIndex === -1 && bIndex !== -1) {
          return 1
        }
        if (aIndex !== -1 && bIndex === -1) {
          return -1
        }
        return aIndex - bIndex
      })
    },
    isUpdatedGroupByIndex(index: number) {
      return (
        typeof this.isUpdatedGroup.find((val) => {
          return index === val
        }) !== 'undefined'
      )
    },
    isUpdatedTable() {
      return this.isUpdatedGroup.length > 0
    },
    cleanUpdatedGroupById(index: number) {
      const removedData = this.isUpdatedGroup.splice(
        this.isUpdatedGroup.findIndex((v) => {
          return v === index
        }),
        1
      )
      if (removedData.length > 0) {
        this.baseValue.achievementCategories[index] = clone(
          this.achievementKind.achievementCategories[index]
        )
      }
    },
    categorySort(listIndex: number, categorizeIndex: number) {
      ;(
        this.achievementKind as AchievementKind<EditAchievement>
      ).achievementCategories[listIndex].group[categorizeIndex].data.sort(
        (a, b) => {
          console.log(
            'a.sourceIndex, b.sourceIndex',
            a.sourceIndex,
            b.sourceIndex
          )
          const aIndex = a.sourceIndex ? a.sourceIndex : -1
          const bIndex = b.sourceIndex ? b.sourceIndex : -1
          // sourceIndexが-1の値は全ての一番最後に配置するように
          if (aIndex === -1 && bIndex !== -1) {
            return 1
          }
          if (aIndex !== -1 && bIndex === -1) {
            return -1
          }
          return aIndex - bIndex
        }
      )
    },
    async saveCategoryTable() {
      const promiseProcesses: Promise<void>[] = []
      this.achievementKind.achievementCategories.forEach((_, index) => {
        promiseProcesses.push(this.saveCategoryGroupById(index))
      })
      await Promise.all(promiseProcesses).catch((error) => {
        console.error(error)
      })
      this.outputSnackbar({
        text: `${this.achievementKind.kind.name} has been saved.`,
      })
    },
    async saveCategoryGroupById(listIndex: number) {
      // 手動セーブ、自動セーブにした場合ははwatchをコメントアウトすること。
      const error = await AchievementStore.postAchievementDataListByKey({
        AchievementCategory:
          this.achievementKind.achievementCategories[listIndex],
        key: this.achievementKind.key,
        listIndex,
      } as VuexPostAchievemntByKey)
      if (isLocalError(error)) {
        this.$emit(OUTPUT_SNACKBAR, {
          text: error.value,
          color: 'error',
        })
        return
      }
      this.cleanUpdatedGroupById(listIndex)
      this.outputSnackbar({
        text: `${this.achievementKind.achievementCategories[listIndex].title} has been saved.`,
      })
    },
    confirmTagSelected() {
      this.selectedTagIds = this.editTagIds
      // なぜかwatchが効かないのでここで調整
      this.closeOverlay()
    },

    confirmPatchSelected() {
      this.selectedPatch = this.editPatch
      // なぜかwatchが効かないのでここで調整
      this.closeOverlay()
    },
    confirmEditText() {
      this.selectedTextVal = this.editTextVal
      // なぜかwatchが効かないのでここで調整
      this.closeOverlay()
    },
    getTagById(id: number) {
      return (this as any).getTagByIdProcess(TagStore.getTags, id)
    },
  },
})
</script>

<style lang="scss" scoped></style>
