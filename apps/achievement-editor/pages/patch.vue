// ここから
<template>
  <v-row no-gutters class="text-center">
    <v-col cols="12">
      <h1>
        パッチ
        <v-icon v-show="isUpdated" color="green">fas fa-sync-alt</v-icon>
        <v-btn fab small class="ml-3 d-inline" @click="savePatch"
          ><v-icon>fas fa-save</v-icon></v-btn
        >
      </h1>
    </v-col>
    <v-col cols="12">
      <v-card class="mb-2">
        <v-card-text>
          <v-row no-gutters class="text-left">
            <v-col cols="12">
              <label class="caption">新規パッチ作成</label>
            </v-col>
            <v-col cols="12">
              <v-row no-gutters>
                <v-col cols="auto">
                  <v-text-field
                    v-model.number="patchId"
                    class="mr-3"
                    type="number"
                    label="パッチID"
                    :error-messages="patchIdErrors"
                  ></v-text-field>
                </v-col>
                <v-col>
                  <v-text-field
                    v-model="patchNumber"
                    class="mr-3"
                    label="パッチナンバリング"
                    :error-messages="patchNumberErrors"
                  ></v-text-field>
                </v-col>
                <v-col>
                  <v-text-field
                    v-model="patchSubtitle"
                    class="mr-3"
                    label="サブタイトル"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <v-row no-gutters>
                <v-col>
                  <v-dialog
                    ref="dialog"
                    v-model="modal"
                    :return-value.sync="patchDate"
                    persistent
                    width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="patchDate"
                        class="mr-3"
                        label="Picker in dialog"
                        prepend-icon="mdi-calendar"
                        readonly
                        v-bind="attrs"
                        :error-messages="patchDateErrors"
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="patchDate"
                      color="green lighten-1"
                      label="パッチ適用日"
                    >
                      <v-spacer></v-spacer>
                      <v-btn text color="primary" @click="modal = false">
                        Cancel
                      </v-btn>
                      <v-btn
                        text
                        color="primary"
                        @click="$refs.dialog.save(patchDate)"
                      >
                        OK
                      </v-btn>
                    </v-date-picker>
                  </v-dialog>
                </v-col>
                <v-col>
                  <v-select
                    v-model="patchTargetVersion"
                    :items="targetVersions"
                    :error-messages="patchTargetVersionErrors"
                    item-text="name"
                    item-value="version"
                    label="対象バージョン"
                  ></v-select>
                </v-col>
                <v-col cols="auto">
                  <v-btn @click="addPatch">追加</v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row no-gutters class="text-left">
            <v-col cols="12">
              <label class="caption"> リリース後は使わないように。 </label>
            </v-col>
            <v-col cols="auto">
              <v-checkbox
                v-model="isForcePatchUpdate"
                label="パッチID強制変更"
                color="white"
                background-color="red"
              >
              </v-checkbox>
            </v-col>
            <v-col class="mr-3" cols="auto" align-self="center">
              <p class="ml-3">
                パッチ更新後、アチーブメント更新保存
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
    <client-only>
      <v-col cols="12">
        <v-expansion-panels multiple @change="sortPatch()">
          <v-expansion-panel
            v-for="version in targetVersionsWithoutGeneral"
            :key="version.version"
            class="mb-2 text-left"
            rounded
            outlined
          >
            <v-expansion-panel-header>
              <h2>{{ version.version }}.{{ version.name }}</h2>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <div
                v-for="(patch, index) in getPatchesByVersion(version.version)"
                :key="patch.id"
              >
                <v-row no-gutters
                  ><v-col cols="auto">
                    {{ patch.id }}. {{ patch.number
                    }}<span> - {{ patch.subtitle }}</span
                    ><br />
                    実装日:
                    {{ patch.date }}
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon class="ml-4" @click.stop="deletePatch(index)"
                      ><v-icon>fas fa-trash</v-icon></v-btn
                    >
                  </v-col>
                  <v-col cols="12">
                    <v-divider
                      v-if="
                        index !==
                        getPatchesByVersion(version.version).length - 1
                      "
                      class="my-2"
                    ></v-divider>
                  </v-col>
                </v-row>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
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
import {
  EditAchievement,
  Patch,
  FetchedAchievementKind,
} from '@murofush/forfan-common-package/lib/types'
import {
  getOutputAchievementTableGroupFromEdit,
  getOutputAchievementFile,
  isLocalError,
} from '@murofush/forfan-common-package/lib/function'
import { TARGET_VERSIONS } from '@murofush/forfan-common-package/lib/const'
import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
import validationMixin from '~/mixins/validation'
import { PatchStore, AchievementStore } from '~/store'

const clone = rfdc()

interface flattenPatchObj {
  [key: string]: any
}

export default Vue.extend({
  mixins: [validationMixin],
  asyncData() {
    const achievementDataList = AchievementStore.getAchievementDataList
    return {
      achievementDataList: clone(achievementDataList),
      baseAchievementDataList: clone(achievementDataList),
    }
  },
  validations: {
    patchId: {
      required,
      notsame: not((val: any, model: any) => {
        return (
          !model.isForcePatchUpdate &&
          !!model.getPatchIds().find((existVal: number) => {
            // eslint-disable-next-line eqeqeq
            return existVal == val
          })
        )
      }),
      minValue: minValue(1),
    },
    patchNumber: {
      required,
      notsame: not((val: any, model: any) => {
        return !!model.getPatchNames().find((existVal: number) => {
          // eslint-disable-next-line eqeqeq
          return existVal === val
        })
      }),
    },
    patchDate: {
      required,
      minValue: (value): boolean => {
        if (value) {
          return (
            value.substr(0, 10) >=
            new Date('2010-9-30').toISOString().substr(0, 10)
          )
        }
        return false
      },
    },
    patchTargetVersion: {
      required,
      minValue: minValue(1),
    },
  },
  data() {
    return {
      modal: false,
      isForcePatchUpdate: false,
      insertable: true,
      patchId: 0 as number,
      patchImageSize: 30,
      patchNumber: '',
      patchSubtitle: '',
      patchDate: null as Date | null,
      patchTargetVersion: 0,
      patchIsFrameEnabled: false,
      achievementDataList: [] as FetchedAchievementKind<EditAchievement>[],
      baseAchievementDataList: [] as FetchedAchievementKind<EditAchievement>[],
      editPatches: clone(PatchStore.getPatches),
      basePatches: clone(PatchStore.getPatches),
      isUpdated: false,
      isAchievementUpdated: false,
    }
  },
  computed: {
    targetVersions() {
      return TARGET_VERSIONS
    },
    targetVersionsWithoutGeneral() {
      return TARGET_VERSIONS.slice(1, TARGET_VERSIONS.length)
    },
    deepcopyPatches(): Patch[] {
      return clone(this.editPatches)
    },
    patchIdErrors() {
      const errors: string[] = []
      if (!this.$v.patchId.$dirty) return errors
      !this.$v.patchId.required && errors.push('必須です')
      !this.$v.patchId.notsame && errors.push('IDが重複してます')
      !this.$v.patchId.minValue && errors.push('1以上を設定してください')
      return errors
    },
    patchNumberErrors() {
      const errors: string[] = []
      if (!this.$v.patchNumber.$dirty) return errors
      !this.$v.patchNumber.required && errors.push('必須です')
      !this.$v.patchNumber.notsame && errors.push('ナンバリングが重複してます')
      return errors
    },
    patchDateErrors() {
      const errors: string[] = []
      if (!this.$v.patchDate.$dirty) return errors
      !this.$v.patchDate.required && errors.push('必須です')
      !this.$v.patchDate.minValue && errors.push('日付情報を入力してください')
      return errors
    },
    patchTargetVersionErrors() {
      const errors: string[] = []
      if (!this.$v.patchTargetVersion.$dirty) return errors
      !this.$v.patchTargetVersion.required && errors.push('必須です')
      !this.$v.patchTargetVersion.minValue &&
        errors.push('バージョンを指定してください')
      return errors
    },
  },
  watch: {
    deepcopyPatches: {
      handler(val: TemplateStringsArray[]) {
        const vm = this
        const diffObj = diff(val, vm.basePatches)
        this.isUpdated = Object.keys(diffObj).length > 0
      },
      deep: true,
    },
  },
  mounted() {
    this.patchId = this.getLatestPatchId() + 1
  },
  methods: {
    addPatch() {
      this.$v.patchId.$touch()
      this.$v.patchNumber.$touch()
      this.$v.patchDate.$touch()
      this.$v.patchTargetVersion.$touch()
      if (
        this.$v.patchId.$invalid ||
        this.$v.patchNumber.$invalid ||
        this.$v.patchDate.$invalid ||
        this.$v.patchTargetVersion.$invalid
      ) {
        return
      }
      const patch: Patch = {
        id: this.patchId,
        number: this.patchNumber,
        // Validateでrequiredチェックはしてる
        date: new Date(this.patchDate!!),
        targetVersion: this.patchTargetVersion,
        subtitle: this.patchSubtitle!!,
      }
      if (this.isForcePatchUpdate) {
        this.forceInsertPatchID()
      }
      this.editPatches.push(patch)

      this.$v.$reset()
      this.patchId = this.getLatestPatchId() + 1
      this.patchNumber = ''
      this.patchDate = null
    },
    async savePatch() {
      const error = await PatchStore.postPatches(clone(this.editPatches))
      if (isLocalError(error)) {
        this.$nuxt.$emit(OUTPUT_SNACKBAR, {
          text: error.value,
          color: 'error',
        })
        return
      }
      this.basePatches = clone(this.editPatches)
      this.isUpdated = false
    },
    saveAchievement() {
      this.achievementDataList.forEach((data) => {
        data.achievementCategories.forEach(async (list) => {
          try {
            await this.$axios.$post('/api/save_text', {
              text: JSON.stringify(
                getOutputAchievementTableGroupFromEdit(list),
                null,
                '\t'
              ),
              path: getOutputAchievementFile(data.key, list.title),
            })
          } catch (error: any) {
            console.error(error)
          }
        })
      })
      this.baseAchievementDataList = clone(this.achievementDataList)
      this.isAchievementUpdated = false
    },
    getPatchesByVersion(version: number): Patch[] {
      return this.editPatches.filter((val) => {
        return val.targetVersion === version
      })
    },
    forEachFlattenPatchValue(cb: (key: string, value: any) => void) {
      const flatPatches: flattenPatchObj = flat.flatten(this.editPatches)
      if (flatPatches) {
        Object.entries(flatPatches).forEach(([key, value]) => {
          cb(key, value)
        })
      }
    },
    getPatchNames(): string[] {
      const names: string[] = []
      this.forEachFlattenPatchValue((key, value) => {
        if (key.includes('name') && typeof value === 'string') {
          names.push(value)
        }
      })
      return names
    },
    getPatchIds(): number[] {
      const ids: number[] = []
      this.forEachFlattenPatchValue((key, value) => {
        if (key.includes('id')) {
          ids.push(value)
        }
      })
      return ids
    },
    getLatestPatchId() {
      const ids = this.getPatchIds()
      return Math.max(...ids) >= 0 ? Math.max(...ids) : 0
    },
    // !important 以下、この機能はリリース後には使わないこと。
    forceInsertPatchID() {
      this.updateAchievementPatchId((patchId) => {
        if (patchId >= this.patchId) {
          patchId++
        }
        return patchId
      })
      this.editPatches = this.updatePatchId(this.editPatches, (patch) => {
        if (patch.id >= this.patchId) {
          patch.id++
        }
        return patch
      })
      this.checkUpdateAchievement()
    },
    deletePatch(patchIndex: number) {
      const deletedPatch = this.editPatches[patchIndex]

      this.editPatches.splice(patchIndex, 1)
      // !important 以下、この機能はリリース後には使わないこと。
      if (this.isForcePatchUpdate) {
        this.updateAchievementPatchId(
          (patchId) => {
            if (patchId > deletedPatch.id) {
              patchId--
            }
            return patchId
          },
          (patchId) => {
            return patchId !== deletedPatch.id
          }
        )
        this.updatePatchId(this.editPatches, (patch) => {
          if (patch.id >= deletedPatch.id) {
            patch.id--
          }
          return patch
        })
        this.checkUpdateAchievement()
      }
      this.sortPatch()
    },
    sortPatch() {
      this.editPatches.sort((a, b) => {
        const aIndex = a.id ? a.id : -1
        const bIndex = b.id ? b.id : -1
        return aIndex - bIndex
      })
    },
    updatePatchId(patches: Patch[], cbFn: (patch: Patch) => Patch) {
      patches = patches.map(cbFn)
      return patches
    },
    updateAchievementPatchId(
      updateCbFn: (patchId: number) => number,
      filterCbFn?: (patchId: number) => boolean
    ) {
      this.achievementDataList.forEach((achievementVal, achievementIndex) => {
        achievementVal.achievementCategories.forEach((listVal, listIndex) => {
          // Uncategolized PatchID
          listVal.ungroup.forEach((uncategorizedVal, uncategorizedIndex) => {
            if (uncategorizedVal.adjustmentPatchId) {
              let updateNumber = uncategorizedVal.adjustmentPatchId
              if (filterCbFn && !filterCbFn(updateNumber)) {
                this.achievementDataList[
                  achievementIndex
                ].achievementCategories[listIndex].ungroup[
                  uncategorizedIndex
                ].adjustmentPatchId = 0
              } else {
                updateNumber = updateCbFn(updateNumber)
                this.achievementDataList[
                  achievementIndex
                ].achievementCategories[listIndex].ungroup[
                  uncategorizedIndex
                ].adjustmentPatchId = updateNumber
              }
            }
          })
          // Categorized
          listVal.group.forEach((categorizedVal, categorizedIndex) => {
            // Achievement PatchID
            categorizedVal.data.forEach((dataVal, dataIndex) => {
              if (dataVal.adjustmentPatchId) {
                let updateNumber = dataVal.adjustmentPatchId
                if (filterCbFn && !filterCbFn(updateNumber)) {
                  this.achievementDataList[
                    achievementIndex
                  ].achievementCategories[listIndex].group[
                    categorizedIndex
                  ].data[dataIndex].adjustmentPatchId = 0
                } else {
                  updateNumber = updateCbFn(updateNumber)
                  this.achievementDataList[
                    achievementIndex
                  ].achievementCategories[listIndex].group[
                    categorizedIndex
                  ].data[dataIndex].adjustmentPatchId = updateNumber
                }
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
      this.isAchievementUpdated = Object.keys(diffObj).length > 0
    },
  },
})
</script>
<style lang="scss" scoped>
.patch_icon {
  object-fit: contain;
}
</style>
