<template>
  <div>
    <v-row>
      <v-col cols="12">
        <v-row dense>
          <v-col cols="12">
            <h1>設定</h1>
            <v-col cols="12" class="pa-2">
              <v-btn
                large
                class="py-2"
                block
                @click="$emit('save')"
                color="primary"
              >
                <v-icon class="mr-2">fas fa-image</v-icon>保存</v-btn
              >
            </v-col>
            <h2>メイン画像</h2>
            <image-uploader
              class="main-image-uploader"
              :title="dropzoneTitle"
              subTitle="選択後に画像の切り取りを行います"
              @output_snackbar="showSnackbar"
              @input="imageUploaded"
            ></image-uploader>
          </v-col>
          <v-col cols="12">
            <h3>メイン画像配置パターン</h3>
            <v-row dense justify="center" align="center">
              <v-col sm="6" md="12" lg="6" class="px-2">
                <mainImageSelectBtn
                  title="9:16パターン"
                  :src="sideMainImageSrc"
                  :disabled="isFullSizeImage"
                  @click="changeMainImagePattern(false)"
                ></mainImageSelectBtn>
              </v-col>
              <v-col sm="6" md="12" lg="6" class="px-2">
                <mainImageSelectBtn
                  title="全画面(16:9)パターン"
                  :src="fullMainImageSrc"
                  :disabled="!isFullSizeImage"
                  @click="changeMainImagePattern(true)"
                ></mainImageSelectBtn>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <h3>メイン画像設定</h3>
            <v-row dense>
              <v-col cols="auto">
                <v-checkbox
                  class="my-0 mr-2 pa-0"
                  dense
                  hide-details
                  v-model="isFullSizeImage"
                  label="画像を全画面で表示する"
                ></v-checkbox>
              </v-col>
              <v-col cols="auto">
                <v-checkbox
                  class="ma-0 mr-2 pa-0"
                  dense
                  hide-details
                  v-model="isImageRight"
                  label="画像を右側に表示する"
                ></v-checkbox>
              </v-col>
              <v-col cols="12">
                <h4>メイン画像表示範囲（全画面パターンのみ）</h4>
                <v-slider
                  v-model="widthSpace"
                  hide-details
                  :disabled="!isFullSizeImage"
                  min="0"
                  max="100"
                  thumb-label
                  @end="updateCanvas"
                >
                </v-slider>
              </v-col>
              <v-col cols="12">
                <h4>情報グループ透過度（全画面パターンのみ）</h4>
                <v-slider
                  v-model="infoBackgroundOpacity"
                  hide-details
                  :disabled="!isFullSizeImage"
                  min="0"
                  max="1"
                  thumb-label
                  step="0.05"
                ></v-slider>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" class="py-2">
        <h2>紹介文</h2>
        <v-textarea
          v-model="description"
          :rows="descriptionRows"
          auto-grow
        ></v-textarea>
      </v-col>
      <v-col cols="12" class="py-2">
        <v-row dense>
          <h2>テーマ選択</h2>
          <v-col cols="12">
            <v-radio-group
              v-model="theme"
              row
              class="my-0 mr-2 pa-0"
              dense
              hide-details
            >
              <v-radio
                v-for="key in cardColorKeys"
                :key="key"
                :label="key"
                :value="key"
              ></v-radio>
            </v-radio-group>
          </v-col>
          <v-col cols="12">
            <v-checkbox
              v-model="isCardColorChangeable"
              class="my-0 mr-2 pa-0"
              dense
              hide-details
              label="配色を選択する"
            ></v-checkbox>
          </v-col>
        </v-row>
      </v-col>
      <v-expansion-panels
        v-model="colorPanel"
        flat
        tile
        v-show="isCardColorChangeable"
      >
        <v-expansion-panel>
          <v-expansion-panel-header>
            <h3>配色設定</h3>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row dense justify="space-around">
              <v-col cols="12">
                <v-row no-gutters justify="end">
                  <v-col cols="auto">
                    <v-btn @click="resetCardColor" color="secondary">
                      配色のリセット
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="auto">
                <h4>文字色</h4>
                <v-color-picker v-model="textColor"></v-color-picker>
              </v-col>
              <v-col cols="auto">
                <h4>背景色</h4>
                <v-color-picker v-model="backgroundColor"></v-color-picker>
              </v-col>
              <v-col cols="auto">
                <h4>強調色</h4>
                <v-color-picker v-model="accentColor"></v-color-picker>
              </v-col>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-checkbox
        v-model="disabledBeforeUnlockAccent"
        v-show="isUnlockBeforeAdjustAchievements"
        class="my-0 mr-2 pa-0"
        dense
        hide-details
        label="緩和前取得時の強調表示無効化"
      >
      </v-checkbox>
      <v-col cols="12" class="py-2">
        <h2>フォント選択</h2>
        <div class="my-3">
          <h3>キャラクター名</h3>
          <font-select
            v-model="charaNameFontFamily"
            :items="fontALL"
            hide-details
            label="キャラクター名フォント"
          ></font-select>
          <v-checkbox
            v-model="nameTextBold"
            class="my-0 mr-2 pa-0"
            dense
            hide-details
            label="太字（Bold）"
          ></v-checkbox>
        </div>

        <div class="my-3">
          <h3>全体</h3>
          <font-select
            v-model="charaInfoFontFamilyJP"
            hide-details
            :items="fontJP"
            label="名刺全体フォント(JP)"
          >
          </font-select>
          <v-checkbox
            v-model="infoTextBold"
            class="my-0 mr-2 pa-0"
            dense
            hide-details
            label="太字（Bold）"
          ></v-checkbox>
        </div>
        <div class="my-3">
          <v-checkbox
            v-model="charaInfoFontFamilyENEnabled"
            class="mb-1 mr-2 pa-0"
            dense
            hide-details
            label="英数字専用の別フォントを適用する"
          ></v-checkbox>
          <font-select
            v-show="charaInfoFontFamilyENEnabled"
            v-model="charaInfoFontFamilyEN"
            :disabled="!charaInfoFontFamilyENEnabled"
            :items="fontEN"
            hide-details
            clearable
            label="名刺全体フォント(JP)"
          >
          </font-select>
        </div>
      </v-col>
      <v-col cols="12" class="pa-2">
        <v-btn large class="py-2" block @click="$emit('save')" color="primary">
          <v-icon class="mr-2">fas fa-image</v-icon>保存</v-btn
        >
      </v-col>
      <v-col cols="12" class="pa-2">
        <v-row no-gutters>
          <v-col cols="6" class="px-2">
            <v-icon-btn
              small
              class="py-1"
              text="キャラクター選択"
              icon="fas fa-user-plus"
              @click="toCharaSelect"
              color="secondary"
            ></v-icon-btn>
          </v-col>
          <v-col cols="6" class="px-2">
            <v-icon-btn
              small
              class="py-1"
              text="アチーブメント選択"
              icon="fas fa-star"
              @click="toAchieveSelect"
              color="secondary"
            ></v-icon-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-dialog v-model="cropperDialog" width="80%" persistent>
      <image-cropper-card
        :uploadedImage.sync="uploadedImage"
        :cropRatio="cropRatio"
        @cropped="imageCropped"
        @output_snackbar="showSnackbar"
      ></image-cropper-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import {
    CropRatio,
    EmitImageUpload,
    emitOutputSnackbar,
  } from '@murofush/forfan-common-vue/lib/types'
  import { PatchMixin } from '@murofush/forfan-common-vue'
  import imageCropperCard from '~/components/characterCard/imageCropperCard.vue'
  import mainImageSelectBtn from '~/components/characterCard/molecules/mainImageSelectBtn.vue'

  import Vue from 'vue'
  import { themeColor, fontEN, fontJP } from '~/common/const'
  import VIconBtn from '~/components/atoms/VIconBtn.vue'
  import fontSelect from '~/components/atoms/fontSelect.vue'
  import { PatchStore, SelectedCharaInfoStore } from '~/store'
  import { Patch } from '@murofush/forfan-common-package/lib/types'
  import { CROP_RATIO_LIST } from '@murofush/forfan-common-vue/lib/const/imageCropper'
  export default Vue.extend({
    props: {
      descriptionRows: {
        type: Number,
        required: true,
      },
    },
    data() {
      return {
        uploadedImage: null as EmitImageUpload | null,
        colorPanel: true,
      }
    },
    components: {
      imageCropperCard,
      VIconBtn,
      fontSelect,
      mainImageSelectBtn,
    },
    mixins: [PatchMixin],
    computed: {
      dropzoneTitle(): string {
        return `${
          this.isFullSizeImage ? '全画面(16:9)' : '9:16'
        }サイズで画像を選択`
      },
      cardColorKeys(): string[] {
        return Object.keys(themeColor)
      },
      cropRatio(): CropRatio {
        return this.isFullSizeImage
          ? CROP_RATIO_LIST.sixteenNine
          : CROP_RATIO_LIST.nineSixteen
      },
      isUnlockBeforeAdjustAchievements(): boolean {
        for (const achievement of SelectedCharaInfoStore.getAchievements) {
          const adjustmentData = this.getAdjustmentPatch(achievement)
          if (
            adjustmentData &&
            adjustmentData.date &&
            achievement.data.completedDate &&
            new Date(achievement.data.completedDate) <
              new Date(adjustmentData.date)
          ) {
            return true
          }
        }
        return false
      },
      sideMainImage() {
        return SelectedCharaInfoStore.getSideMainImage
      },
      sideMainImageSrc(): string | null {
        return this.sideMainImage?.src ?? null
      },
      fullMainImage() {
        return SelectedCharaInfoStore.getFullMainImage
      },
      fullMainImageSrc(): string | null {
        return this.fullMainImage?.src ?? null
      },
      cropperDialog(): boolean {
        return !!this.uploadedImage && this.uploadedImage.image !== null
      },
      description: {
        get(): string {
          return SelectedCharaInfoStore.getDescription
        },
        set(val: string) {
          SelectedCharaInfoStore.setDescription(val)
        },
      },
      theme: {
        get() {
          return SelectedCharaInfoStore.getTheme
        },
        set(val: Theme) {
          SelectedCharaInfoStore.setTheme(val)
        },
      },
      textColor: {
        get(): string {
          return SelectedCharaInfoStore.getCardColor.textColor
        },
        set(val: string) {
          SelectedCharaInfoStore.setTextColor(val)
        },
      },
      backgroundColor: {
        get(): string {
          return SelectedCharaInfoStore.getCardColor.backgroundColor
        },
        set(val: string) {
          SelectedCharaInfoStore.setBackgroundColor(val)
        },
      },
      accentColor: {
        get(): string {
          return SelectedCharaInfoStore.getCardColor.accentColor
        },
        set(val: string) {
          SelectedCharaInfoStore.setAccentColor(val)
        },
      },
      fontALL(): FontInfo[] {
        return fontEN.concat(fontJP)
      },
      fontEN(): FontInfo[] {
        return fontEN
      },
      fontJP(): FontInfo[] {
        return fontJP
      },
      charaNameFontFamily: {
        get(): string {
          return SelectedCharaInfoStore.getCharaNameFontFamily
        },
        set(val: string) {
          SelectedCharaInfoStore.setCharaNameFontFamily(val)
        },
      },
      charaInfoFontFamilyEN: {
        get(): string | null {
          return SelectedCharaInfoStore.getCharaInfoFontFamilyEN
        },
        set(val: string | null) {
          SelectedCharaInfoStore.setCharaInfoFontFamilyEN(val)
        },
      },
      charaInfoFontFamilyJP: {
        get(): string {
          return SelectedCharaInfoStore.getCharaInfoFontFamilyJP
        },
        set(val: string) {
          SelectedCharaInfoStore.setCharaInfoFontFamilyJP(val)
        },
      },
      charaInfoFontFamilyENEnabled: {
        get(): boolean {
          return SelectedCharaInfoStore.getCharaInfoFontFamilyENEnabled
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setCharaInfoFontFamilyENEnabled(val)
        },
      },
      isCardColorChangeable: {
        get(): boolean {
          return SelectedCharaInfoStore.getIsCardColorChangeable
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setIsCardColorChangeable(val)
        },
      },
      disabledBeforeUnlockAccent: {
        get(): boolean {
          return SelectedCharaInfoStore.getDisabledBeforeUnlockAccent
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setDisabledBeforeUnlockAccent(val)
        },
      },
      nameTextBold: {
        get(): boolean {
          return SelectedCharaInfoStore.getNameTextBold
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setNameTextBold(val)
        },
      },
      infoTextBold: {
        get(): boolean {
          return SelectedCharaInfoStore.getInfoTextBold
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setInfoTextBold(val)
        },
      },
      isFullSizeImage: {
        get(): boolean {
          return SelectedCharaInfoStore.getIsFullSizeImage
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setIsFullSizeImage(val)
        },
      },
      infoBackgroundOpacity: {
        get(): number {
          return SelectedCharaInfoStore.getInfoBackgroundOpacity
        },
        set(val: number) {
          SelectedCharaInfoStore.setInfoBackgroundOpacity(val)
        },
      },
      widthSpace: {
        get() {
          return SelectedCharaInfoStore.getWidthSpace / 4
        },
        set(val: number) {
          SelectedCharaInfoStore.setWidthSpace(val * 4)
        },
      },
      isImageRight: {
        get() {
          return SelectedCharaInfoStore.getIsImageRight
        },
        set(val: boolean) {
          SelectedCharaInfoStore.setIsImageRight(val)
        },
      },
    },
    methods: {
      updateCanvas() {
        this.$emit('updateCanvas')
      },
      getPatchById(id: number): Patch | null {
        return (this as any).getPatchByIdProcess(PatchStore.getPatches, id)
      },
      getAdjustmentPatch(achievement: AchievementDataWithIndex): Patch | null {
        if (achievement.data.adjustmentPatchId) {
          return this.getPatchById(achievement.data.adjustmentPatchId)
        }
        return null
      },
      imageUploaded(uploadedImage: EmitImageUpload) {
        this.uploadedImage = uploadedImage
      },
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$emit(OUTPUT_SNACKBAR, snackbar)
      },
      imageCropped(image: HTMLImageElement) {
        SelectedCharaInfoStore.setMainImage(image)
      },
      toCharaSelect() {
        this.$router.push('/')
      },
      toAchieveSelect() {
        this.$router.push('/selectAchievement')
      },
      resetCardColor() {
        SelectedCharaInfoStore.resetCardColor()
      },
      changeMainImagePattern(isFullSize: boolean) {
        this.isFullSizeImage = isFullSize
      },
    },
  })
</script>
<style lang="scss" scoped>
  h1 {
    font-size: 32px;
    margin-bottom: 20px;
    margin-top: 20px;
  }
  h2 {
    font-size: 32px;
    margin-bottom: 20px;
    margin-top: 20px;
  }
  h3 {
    font-size: 18px;
    margin-bottom: 12px;
    margin-top: 12px;
  }
  h4 {
    font-weight: bold;
    margin-bottom: 8px;
    margin-top: 8px;
  }
</style>
