<template>
  <v-row no-gutters class="text-left">
    <v-col cols="12">
      <label class="caption">キャラクターページからアチーブメントを取得</label>
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="achievementURL"
        :error-messages="achievementURLErrors"
        class="mr-3"
        label="AchievementURL"
      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <v-row no-gutters align="end" justify="end">
        <v-col cols="auto">
          <v-btn
            class="mr-3"
            label="AchievementURL"
            @click="fetchCharacterAchievement"
          >
            URLからアチーブメントを取得
          </v-btn>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="12" class="my-3">
      <v-divider></v-divider>
    </v-col>
    <v-col cols="12">
      <label class="caption">新規アチーブメント作成</label>
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="title"
        class="mr-3"
        label="タイトル"
        :error-messages="titleErrors"
      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <v-textarea
        v-model="description"
        label="説明文"
        :error-messages="descriptionErrors"
      ></v-textarea>
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="iconUrl"
        label="アイコンURL"
        :error-messages="iconUrlErrors"
      ></v-text-field>
      <v-btn :loading="isIconFetching" @click="fetchIconUrl">icon Fetch </v-btn>
      <v-row v-if="!!fetchedIconUrl" class="my-2">
        <v-col cols="auto">
          <v-avatar tile>
            <v-img :aspect-ratio="1" :src="fetchedIconUrl"></v-img>
          </v-avatar>
        </v-col>
        <v-col cols="auto" class="align-self-center">
          <label> {{ iconPath }}</label>
        </v-col>
      </v-row>
      <v-btn v-show="iconPath" :disabled="!iconPath" @click="resetIconPath"
        >clear icon
      </v-btn>
    </v-col>
    <v-col cols="auto">
      <v-text-field
        v-model.number="point"
        label="ポイント"
        type="number"
        :error-messages="pointErrors"
      ></v-text-field>
    </v-col>

    <v-col cols="12">
      <v-row dense>
        <v-col cols="auto">
          <v-checkbox
            v-model="isTitleAwardEnable"
            label="報酬称号"
            class="mr-3"
          ></v-checkbox>
        </v-col>
        <v-col cols="auto">
          <v-checkbox
            v-model="isTitleAwardGender"
            :disabled="!isTitleAwardEnable"
            label="男女別報酬"
          ></v-checkbox>
        </v-col>
      </v-row>
    </v-col>

    <v-col v-show="isEnableTitleCommon()" cols="12">
      <v-text-field
        v-model="titleAward"
        :disabled="!isEnableTitleCommon()"
        label="報酬称号名"
        :error-messages="titleAwardErrors"
      ></v-text-field>
    </v-col>

    <v-col v-show="isEnableTitleByGender()" cols="12">
      <v-row dense>
        <v-col cols="6">
          <v-text-field
            v-model="titleAwardMan"
            :disabled="!isEnableTitleByGender()"
            label="報酬称号:男性名"
            :error-messages="titleAwardGenderErrors"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="titleAwardWoman"
            :disabled="!isEnableTitleByGender()"
            label="報酬称号:女性名"
            :error-messages="titleAwardGenderErrors"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="12">
      <v-checkbox
        v-model="isItemAwardEnable"
        label="報酬アイテム"
        class="mr-3"
      ></v-checkbox>
    </v-col>
    <v-col v-show="isItemAwardEnable" cols="12">
      <v-text-field
        v-model="itemAwardUrl"
        :disabled="!isItemAwardEnable"
        label="報酬アイテムURL"
        :error-messages="itemAwardUrlErrors"
      ></v-text-field>
      <v-btn
        :disabled="isItemFetching"
        :loading="isItemFetching"
        @click="fetchItemUrl"
        >item Fetch
      </v-btn>
    </v-col>
    <v-col v-if="itemAwardObject" cols="12">
      <itemViewer v-model="itemAwardObject"></itemViewer>
      <v-btn :disabled="!itemAward" @click="resetItemAward">Clear </v-btn>
    </v-col>
    <v-col cols="12">
      <v-checkbox
        v-model="isAwardConditionEnable"
        disabled
        label="アチーブメント条件(未実装)"
        class="mr-3"
      ></v-checkbox>
    </v-col>
    <v-col v-show="isAwardConditionEnable" cols="12">
      <v-text-field
        v-model="awardCondition"
        :disabled="!isAwardConditionEnable"
        label="アチーブメント条件"
      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <v-checkbox
        v-model="isLatestPatch"
        label="最新パッチコンテンツ"
        class="mr-3"
      ></v-checkbox>
    </v-col>
    <v-col cols="12">
      <v-btn @click="createInputAchievement">追加</v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
import { required, requiredIf } from 'vuelidate/lib/validators'
import {
  EditAchievement,
  LocalError,
  FetchedItemData,
} from '@murofush/forfan-common-package/lib/types'
import {
  ICON_REGEXP,
  LOADSTONE_REGEXP,
  CHARACTER_REGEXP,
} from '@murofush/forfan-common-package/lib/const'
import { isLocalError } from '@murofush/forfan-common-package/lib/function'
import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
import validationMixin from '~/mixins/validation'
import itemViewer from '~/components/itemViewer.vue'

function initializeStatus() {
  return Object.assign(
    {
      achievementURL: '',

      title: '',
      description: '',
      iconUrl: '',
      fetchedIconUrl: '',
      iconPath: '',
      isIconFetching: false,
      point: 10,

      isTitleAwardEnable: false,
      titleAward: '',
      isTitleAwardGender: false,
      titleAwardWoman: '',
      titleAwardMan: '',
      isLatestPatch: false,

      isItemAwardEnable: false,
      isItemFetching: false,
      itemAward: '',
      itemAwardUrl: '',
      itemAwardImageUrl: '',
      itemAwardImagePath: '',

      isAwardConditionEnable: false,
      awardCondition: [],
    },
    initializeItemAward()
  )
}

function initializeItemAward() {
  return {
    itemAward: '',
    itemAwardUrl: '',
    fetchedItemAwardUrl: '',
    itemAwardImageUrl: '',
    itemAwardImagePath: '',
  }
}

export default Vue.extend({
  components: {
    itemViewer,
  },
  mixins: [validationMixin],
  props: {
    categoryKey: {
      type: String,
      required: true,
    },
    group: {
      type: String,
      default: '',
      required: true,
    },
  },
  data() {
    return initializeStatus()
  },
  validations: {
    achievementURL: {
      required,
      isCharacterPage(url: string) {
        return url ? CHARACTER_REGEXP.test(url.split('?')[0]) : true
      },
    },
    title: {
      required,
    },
    description: {
      required,
    },
    point: {
      required,
    },
    iconPath: {
      required,
    },
    iconUrl: {
      required: requiredIf((model) => {
        return !model.iconPath
      }),
      isLoadstoneIcon(url: string) {
        return url ? ICON_REGEXP.test(url.split('?')[0]) : true
      },
    },
    titleAward: {
      required: requiredIf((model) => {
        // TODO: ここの解決方法１０分程度調べてわからなかったから一旦逃げ。
        // いつかはanyから直す。
        return model.isEnableTitleCommon()
      }),
    },
    titleAwardMan: {
      required: requiredIf((model) => {
        return model.isEnableTitleByGender()
      }),
    },
    titleAwardWoman: {
      required: requiredIf((model) => {
        return model.isEnableTitleByGender()
      }),
    },
    itemAward: {
      required: requiredIf((model) => {
        return model.isItemAwardEnable
      }),
    },
    itemAwardUrl: {
      required: requiredIf((model) => {
        return model.isItemAwardEnable && !model.itemAward
      }),
      isLoadstonePage(page: string) {
        return page ? LOADSTONE_REGEXP.test(page.split('?')[0]) : true
      },
    },
  },
  computed: {
    achievementURLErrors() {
      const errors: string[] = []
      if (!this.$v.achievementURL.$dirty) return errors
      !this.$v.achievementURL.required &&
        errors.push((this as any).requiredError('アチーブメントURL'))
      !this.$v.achievementURL.isCharacterPage &&
        errors.push((this as any).loadstoneError('アチーブメントURL'))
      return errors
    },
    titleErrors() {
      const errors: string[] = []
      if (!this.$v.title.$dirty) return errors
      !this.$v.title.required &&
        errors.push((this as any).requiredError('タイトル'))
      return errors
    },
    descriptionErrors() {
      const errors: string[] = []
      if (!this.$v.description.$dirty) return errors
      !this.$v.description.required &&
        errors.push((this as any).requiredError('説明文'))
      return errors
    },
    iconUrlErrors() {
      const errors: string[] = []
      if (!this.$v.iconUrl.$dirty) return errors
      !this.$v.iconUrl.required &&
        errors.push((this as any).requiredError('iconUrl'))
      !this.$v.iconUrl.isLoadstoneIcon &&
        errors.push((this as any).loadstoneError('iconUrl'))
      !this.$v.iconPath.required &&
        errors.push((this as any).requiredError('iconPath'))
      return errors
    },
    pointErrors() {
      const errors: string[] = []
      if (!this.$v.point.$dirty) return errors
      !this.$v.point.required &&
        errors.push((this as any).requiredError('ポイント'))
      return errors
    },
    titleAwardErrors() {
      const errors: string[] = []
      if (!this.$v.titleAward.$dirty) return errors
      !this.$v.titleAward.required &&
        errors.push((this as any).requiredError('称号報酬'))
      return errors
    },
    titleAwardGenderErrors() {
      const errors: string[] = []
      if (!this.$v.titleAwardMan.$dirty) return errors
      !this.$v.titleAwardMan.required &&
        errors.push((this as any).requiredError('称号報酬'))
      !this.$v.titleAwardWoman.required &&
        errors.push((this as any).requiredError('称号報酬'))
      return errors
    },
    itemAwardErrors() {
      const errors: string[] = []
      if (!this.$v.itemAward.$dirty) return errors
      !this.$v.itemAward.required &&
        errors.push((this as any).requiredError('アイテム報酬'))
      return errors
    },
    itemAwardUrlErrors() {
      const errors: string[] = []
      if (!this.$v.itemAwardUrl.$dirty) return errors
      !this.$v.itemAwardUrl.required &&
        errors.push((this as any).requiredError('アイテムURL'))
      !this.$v.itemAwardUrl.isLoadstonePage &&
        errors.push((this as any).loadstoneError('アイテムURL'))
      return errors
    },
    itemAwardObject(): FetchedItemData | null {
      if (this.itemAward) {
        return {
          itemAward: this.itemAward!!,
          itemAwardUrl: this.fetchedItemAwardUrl!!,
          itemAwardImageUrl: this.itemAwardImageUrl!!,
          itemAwardImagePath: this.itemAwardImagePath!!,
        }
      }
      return null
    },
  },
  methods: {
    createInputAchievement() {
      this.$v.title.$touch()
      this.$v.description.$touch()
      this.$v.iconUrl.$touch()
      this.$v.iconPath.$touch()
      this.$v.point.$touch()
      this.$v.titleAward.$touch()
      this.$v.titleAwardMan.$touch()
      this.$v.titleAwardWoman.$touch()
      this.$v.itemAward.$touch()
      this.$v.itemAwardUrl.$touch()

      if (
        this.$v.title.$invalid ||
        this.$v.description.$invalid ||
        this.$v.iconUrl.$invalid ||
        this.$v.iconPath.$invalid ||
        this.$v.point.$invalid ||
        this.$v.titleAward.$invalid ||
        this.$v.titleAwardMan.$invalid ||
        this.$v.titleAwardWoman.$invalid ||
        this.$v.itemAward.$invalid ||
        this.$v.itemAwardUrl.$invalid
      ) {
        return
      }
      const response: EditAchievement = {
        title: this.title,
        iconUrl: this.fetchedIconUrl,
        iconPath: this.iconPath,
        description: this.description,
        point: this.point,
        isCreated: true,
        isEdited: true,
        isNowCreated: true,
        isLatestPatch: this.isLatestPatch,
        sourceIndex: -1,
        tagIds: [],
        adjustmentPatchId: 0,
        patchId: 0,
      }
      if (this.isTitleAwardEnable) {
        if (this.isTitleAwardGender) {
          response.titleAwardMan = this.titleAwardMan
          response.titleAwardWoman = this.titleAwardWoman
        } else {
          response.titleAward = this.titleAward
        }
      }
      if (this.isItemAwardEnable) {
        response.itemAward = this.itemAward
        response.itemAwardUrl = this.fetchedItemAwardUrl
        response.itemAwardImageUrl = this.itemAwardImageUrl
        response.itemAwardImagePath = this.itemAwardImagePath
      }
      this.$emit('achievement_create', response)
      this.$v.$reset()
      this.dataReset()
    },
    async fetchCharacterAchievement() {
      this.$v.achievementURL.$touch()
      if (this.$v.achievementURL.$invalid) {
        return
      }
      const response: EditAchievement | LocalError = await this.$axios
        .$get('/api/get_hidden_achievement', {
          params: {
            url: this.achievementURL,
            category: this.categoryKey,
            group: this.group,
          },
        })
        .catch((error: any) => {
          console.error(error)
        })
      if (isLocalError(response)) {
        console.error(response.value)
        this.$emit(OUTPUT_SNACKBAR, { text: response.value, color: 'error' })
      } else {
        this.$emit('achievement_create', response)
        this.$v.$reset()
        this.dataReset()
      }
      console.log(response)
    },
    dataReset() {
      Object.assign(this.$data, initializeStatus())
    },
    isEnableTitleByGender(): boolean {
      return this.isTitleAwardEnable && this.isTitleAwardGender
    },
    isEnableTitleCommon(): boolean {
      return this.isTitleAwardEnable && !this.isTitleAwardGender
    },
    async fetchIconUrl() {
      this.$v.iconUrl.$touch()
      if (this.$v.iconUrl.$invalid) {
        return
      }
      this.isIconFetching = true
      const response: string | LocalError = await this.$axios
        .$get('/api/get_icon_img', {
          params: {
            url: this.iconUrl,
            category: this.categoryKey,
            group: this.group,
          },
        })
        .catch((error: any) => {
          console.error(error)
        })

      this.isIconFetching = false
      if (isLocalError(response)) {
        console.error(response.value)
        this.$emit(OUTPUT_SNACKBAR, { text: response.value, color: 'error' })
      } else {
        this.iconPath = response
        this.fetchedIconUrl = this.iconUrl
        this.iconUrl = ''
      }
    },
    async fetchItemUrl() {
      this.$v.itemAwardUrl.$touch()
      if (this.$v.itemAwardUrl.$invalid) {
        return
      }
      this.isItemFetching = true
      const response: FetchedItemData | LocalError = await this.$axios
        .$get('/api/get_item_infomation', {
          params: {
            url: this.itemAwardUrl,
            category: this.categoryKey,
            group: this.group,
          },
        })
        .catch((error: any) => {
          console.error(error)
        })
      this.isItemFetching = false
      if (isLocalError(response)) {
        console.error(response.value)
        this.$emit(OUTPUT_SNACKBAR, { text: response.value, color: 'error' })
      } else {
        this.itemAward = response.itemAward
        this.fetchedItemAwardUrl = response.itemAwardUrl
        this.itemAwardImageUrl = response.itemAwardImageUrl
        this.itemAwardImagePath = response.itemAwardImagePath
      }
    },
    resetItemAward() {
      Object.assign(this.$data, initializeItemAward())
    },
    resetIconPath() {
      this.iconPath = ''
    },
  },
})
</script>

<style></style>
