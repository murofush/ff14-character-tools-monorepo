<template>
  <div>
    <div ref="container" class="canvas" :style="containerStyle">
      <client-only>
        <v-stage ref="stage">
          <v-layer ref="layer">
            <v-group ref="outputGroup" :config="configOutputGroup">
              <v-rect ref="background" :config="configBackground"></v-rect>
              <v-image ref="mainImage" :config="configMainImage"> </v-image>
              <v-group :config="configTemplateImageGroup">
                <v-rect ref="templateRect" :config="configTemplateRect">
                </v-rect>
                <v-text
                  ref="templateText"
                  :config="configTemplateText"
                ></v-text>
              </v-group>
              <v-rect
                ref="InfoBackground"
                :config="configInfoBackground"
              ></v-rect>
              <v-group ref="infoGroup" :config="configInfoGroup">
                <v-group ref="charaGroup" :config="configCharaGroup">
                  <v-text ref="charaData" :config="configCharaData"></v-text>
                  <v-text ref="charaSince" :config="configCharaSince"></v-text>
                  <v-text ref="charaName" :config="configCharaName"></v-text>
                </v-group>
                <v-group ref="serverGroup" :config="configServerGroup">
                  <v-async-image
                    ref="dcImage"
                    :src="serverImgSrc"
                    :config="configDcImage"
                  ></v-async-image>
                  <v-text ref="dcName" :config="configDcName"></v-text>
                  <v-text ref="serverName" :config="configServerName"></v-text>
                </v-group>
                <v-group
                  ref="fcGroup"
                  :config="configFcGroup"
                  v-if="responseData && responseData.freecompanyInfo"
                >
                  <template v-for="(src, index) in fcImageSrcArray">
                    <v-async-image
                      :key="index"
                      :src="src"
                      :config="configFcCrest"
                    ></v-async-image>
                  </template>
                  <v-text ref="fcName" :config="configFcName"></v-text>
                  <v-async-image
                    ref="fcPositionImage"
                    :src="imageFcPostiionImageUrl"
                    :config="configImageFcPosition"
                  ></v-async-image>
                  <v-text
                    ref="fcPositionText"
                    :config="configTextFcPositon"
                  ></v-text>
                </v-group>
                <v-group ref="descGroup" :config="configDescGroup">
                  <v-line
                    ref="borderTopDesc"
                    :config="configBorderTopDesc"
                  ></v-line>
                  <v-text
                    ref="description"
                    :config="configDescription"
                  ></v-text>
                  <v-line
                    ref="borderBottomDesc"
                    :config="configBorderBottomDesc"
                  ></v-line>
                </v-group>
                <v-group :config="configJobAchieveGroup">
                  <job-group
                    ref="jobGroup"
                    :headerHeight="jobAchievementHeaderHeight"
                    :cardColor="cardColor"
                    :config="configJobGroup"
                    :width="jobAchievementWidth"
                  ></job-group>
                  <achievement-group
                    ref="achievementGroup"
                    :headerHeight="jobAchievementHeaderHeight"
                    :cardColor="cardColor"
                    :config="configAchievementGroup"
                    :width="jobAchievementWidth"
                  ></achievement-group>
                </v-group>
                <v-group ref="footer">
                  <v-text ref="charaUrl" :config="configCharaUrl"></v-text>
                  <v-line
                    ref="charaUrlUnderline"
                    :config="configCharaUrlUnderline"
                  ></v-line>
                  <v-text ref="copyright" :config="configCopyright"></v-text>
                </v-group>
              </v-group>
            </v-group>
          </v-layer>
        </v-stage>
      </client-only>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Konva from 'konva'
  import ResizeObserver from 'resize-observer-polyfill'
  import rfdc from 'rfdc'

  import { ImgMixin, DateMixin } from '@murofush/forfan-common-vue'
  import { TARGET_VERSIONS } from '@murofush/forfan-common-package/lib/const'
  import { MIN_OUTPUT_SIZE } from '@murofush/forfan-common-vue/lib/const/imageCropper'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import {
    LOADSTONE_CHARACTER_URL,
    secondaryOpacity,
    themeColor,
  } from '~/common/const'
  import VAsyncImage from '~/components/characterCard/molecules/VAsyncImage.vue'
  import jobGroup from '~/components/characterCard/molecules/JobGroup.vue'
  import achievementGroup from '~/components/characterCard/molecules/AchievementGroup.vue'

  import {
    CharacterInfoStore,
    PatchStore,
    SelectedCharaInfoStore,
  } from '~/store'
  import { FORFAN_RESOURCES_URL } from '@murofush/forfan-common-package/lib/const'
  import { TargetVersion } from '@murofush/forfan-common-package/lib/types'

  import FontFaceObserver from 'fontfaceobserver'

  const clone = rfdc()

  export default Vue.extend({
    mixins: [ImgMixin, DateMixin],
    components: {
      VAsyncImage,
      jobGroup,
      achievementGroup,
    },
    data() {
      return {
        // Common
        canvasWidth: MIN_OUTPUT_SIZE,
        scale: 1,
        isShown: false,
        isFontLoaded: false,
        isCanvasSetuped: false,
        initialized: false,
        textMargin: 20,

        observer: null as ResizeObserver | null,
        groupColumnMargin: 4,
        groupRowMargin: 6,

        templateFontSize: 30,

        // Card Params
        cardRatio: 9 / 16,
        mainImageRatio: 9 / 16,

        // charaInfo
        charaInfoHeight: 28,
        charaInfoFontSize: 28,
        charaSinceFontSize: 24,

        // Infomation Params
        infoMarginStart: 50,
        infoMarginTop: 50,
        infoMarginEnd: 50,
        infoMarginBottom: 20,

        // Character Data params
        charaNameFontSize: 90,
        charaNameMargin: 50,

        // Datacenter, Server Params
        dcNameFontSize: 40,
        serverNameFontSize: 24,

        // FreeCompany Params
        fcNameSize: 40,
        fcPositionSize: 24,

        // Description Params
        descMargin: 16,
        descriptionFontSize: 24,
        descGroupMargin: 15,
        descLineHeight: 1.8,

        // Job, Achievement Params
        jobAchievementMargin: 30,
        jobAchievementHeaderHeight: 50,

        // footer infomation
        copyrightFontSize: 16,
        charaUrlFontSize: 20,
        footerMarginColumn: 6,
      }
    },
    props: {
      maxHeightPx: {
        type: Number,
        default: 0,
      },
      descriptionRows: {
        type: Number,
        required: true,
      },
    },
    async mounted() {
      // カスタムフォントが呼ばれたかどうか。GoogleFontsが読み込まれて適用された段階でロード完了とする。
      // 詳細: https://konvajs.org/docs/sandbox/Custom_Font.html
      // MEMO: ただし、現在は直接このページにアクセスすることを禁止してるので既にフォントが読み込まれてるものとしてる。

      // フォントを複数件読み込み可能にする
      Promise.all(
        this.selectedFontList.map((font) => {
          return new FontFaceObserver(font).load()
        })
      )
        .then(() => {
          console.log('font loaded!')
          if (this.initialized && !this.isCanvasSetuped) {
            this.updateCanvas()
          }
          this.isFontLoaded = true
        })
        .catch((e) => {
          console.error('catch font observer Error: ', e)
          if (this.initialized && !this.isCanvasSetuped) {
            this.updateCanvas()
          }
          this.isFontLoaded = true
        })
      this.observer = new ResizeObserver((_: ResizeObserverEntry[]) => {
        this.isShown = !this.isShown
        if (this.isShown && !this.initialized) {
          this.initialize()
        }
      })
      this.observer.observe(this.$refs.container as Element)
    },
    beforeDestroy() {
      this.clearEventListener()
      if (this.observer) {
        this.observer.disconnect()
      }
    },
    computed: {
      clientHeight: {
        get(): number {
          return (this.$refs.container as Element).clientHeight
        },
        cache: false,
      },
      selectedFontList(): string[] {
        const fonts = []
        if (SelectedCharaInfoStore.getCharaNameFontFamily)
          fonts.push(SelectedCharaInfoStore.getCharaNameFontFamily)
        if (SelectedCharaInfoStore.getCharaInfoFontFamilyJP)
          fonts.push(SelectedCharaInfoStore.getCharaInfoFontFamilyJP)
        if (SelectedCharaInfoStore.getCharaInfoFontFamilyEN)
          fonts.push(SelectedCharaInfoStore.getCharaInfoFontFamilyEN)
        return fonts
      },
      serverImgSrc(): string {
        return `${FORFAN_RESOURCES_URL}/img/server.svg`
      },
      theme(): Theme {
        return SelectedCharaInfoStore.getTheme
      },
      description(): string {
        return SelectedCharaInfoStore.getDescription
      },
      cardColor(): CardColor {
        return SelectedCharaInfoStore.getCardColor
      },
      charaNameFontFamily(): string {
        return SelectedCharaInfoStore.getCharaNameFontFamily
      },
      charaInfoFontFamily(): string {
        return SelectedCharaInfoStore.getCharaInfoFontFamily
      },
      nameTextBold(): string {
        return SelectedCharaInfoStore.getNameTextBold ? 'bold' : ''
      },
      infoTextBold(): string {
        return SelectedCharaInfoStore.getInfoTextBold ? 'bold' : ''
      },
      lineStrokeSize(): number {
        return SelectedCharaInfoStore.getInfoTextBold ? 2 : 1
      },
      isFullSizeImage(): boolean {
        return SelectedCharaInfoStore.getIsFullSizeImage
      },
      widthSpace(): number {
        return this.isFullSizeImage ? SelectedCharaInfoStore.getWidthSpace : 0
      },
      infoBackgroundOpacity(): number {
        return SelectedCharaInfoStore.getInfoBackgroundOpacity
      },
      isImageRight(): boolean {
        return SelectedCharaInfoStore.getIsImageRight
      },
      mainImage(): HTMLImageElement | undefined {
        return (
          (SelectedCharaInfoStore.getIsFullSizeImage
            ? SelectedCharaInfoStore.getFullMainImage
            : SelectedCharaInfoStore.getSideMainImage) ?? undefined
        )
      },
      sideMainImage(): HTMLImageElement | undefined {
        return SelectedCharaInfoStore.getSideMainImage
      },
      configOutputGroup(): Konva.NodeConfig {
        return {
          width: this.canvasWidth,
          height: this.canvasHeight,
          name: 'outputGroup',
        }
      },
      configBackground(): Konva.RectConfig {
        return {
          fill: this.cardColor.backgroundColor,
        }
      },
      configInfoBackground(): Konva.RectConfig {
        const yBorder = Math.min(this.infoMarginTop, this.infoMarginBottom) / 2
        const xBorder = Math.min(this.infoMarginStart, this.infoMarginEnd) / 2
        return {
          x:
            xBorder +
            (this.isImageRight ? 0 : this.canvasImageWidth + this.widthSpace),
          y: yBorder,
          width:
            this.canvasWidth -
            (this.canvasImageWidth + xBorder * 2 + this.widthSpace),
          height: this.canvasHeight - yBorder * 2,
          opacity: this.infoBackgroundOpacity,
          fill: this.cardColor.backgroundColor,
        }
      },
      configTemplateImageGroup(): Konva.NodeConfig {
        return {
          visible: !this.mainImage,
        }
      },
      configMainImageX(): number {
        return this.isImageRight && !this.isFullSizeImage
          ? this.canvasWidth - this.canvasImageWidth
          : 0
      },
      configTemplateText(): Konva.TextConfig {
        return {
          text: 'メイン画像が選択されていません。',
          verticalAlign: 'middle',
          align: 'center',
          fill: themeColor[this.theme].textColor,
          fontSize: this.templateFontSize,
          x: this.isImageRight
            ? this.canvasWidth - (this.canvasImageWidth + this.widthSpace)
            : 0,
          height: this.canvasHeight,
          width: this.canvasImageWidth + this.widthSpace,
        }
      },
      configTemplateRect(): Konva.RectConfig {
        return {
          x: this.configMainImageX,
          y: 0,
          height: this.canvasHeight,
          width: this.isFullSizeImage
            ? this.canvasWidth
            : this.canvasImageWidth,
          fill: this.cardColor.textColor,
          opacity: 0.5,
          fontStyle: this.infoTextBold,
          strokeEnabled: true,
          strokeWidth: 1,
        }
      },
      configMainImage(): Konva.ImageConfig {
        return {
          image: this.mainImage,
          x: this.configMainImageX,
          y: 0,
          visible: !!this.mainImage,
          height: this.canvasHeight,
          width: this.isFullSizeImage
            ? this.canvasWidth
            : this.canvasImageWidth,
        }
      },
      configInfoGroup(): Konva.NodeConfig {
        return {
          x:
            this.infoMarginStart +
            (!this.isImageRight ? this.canvasImageWidth + this.widthSpace : 0),
          y: this.infoMarginTop,
        }
      },
      infoGroupWidth(): number {
        return (
          this.canvasWidth -
          (this.canvasImageWidth +
            this.infoMarginStart +
            this.infoMarginEnd +
            this.widthSpace)
        )
      },
      configCharaGroup(): Konva.NodeConfig {
        return {}
      },
      configCharaData(): Konva.TextConfig {
        const race =
          CharacterInfoStore.getResponseData?.characterData.race ?? ''
        const clan =
          CharacterInfoStore.getResponseData?.characterData.clan ?? ''
        const gender =
          CharacterInfoStore.getResponseData?.characterData.gender ?? ''
        return {
          fontSize: this.charaInfoFontSize,
          height: this.charaInfoHeight,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          fontFamily: this.charaInfoFontFamily,
          align: 'left',
          verticalAlign: 'middle',
          text: `${race}/${clan}/${gender}`,
        }
      },
      configCharaName(): Konva.TextConfig {
        const firstName =
          CharacterInfoStore.getResponseData?.characterData.firstName ?? ''
        const lastName =
          CharacterInfoStore.getResponseData?.characterData.lastName ?? ''
        return {
          fontSize: this.charaNameFontSize,
          fill: this.cardColor.textColor,
          fontFamily: this.charaNameFontFamily,
          fontStyle: this.nameTextBold,
          align: 'left',
          y: this.charaInfoHeight + this.charaNameMargin,
          height: this.charaNameFontSize,
          verticalAlign: 'middle',
          text: `${firstName} ${lastName}`,
        }
      },
      configCharaSince(): Konva.TextConfig {
        const oldestDate = CharacterInfoStore.getOldestAchievementDate
        const visible = !!oldestDate
        let targetVersion: TargetVersion | undefined
        let userCreatedPatchVersin: string = ''
        let oldestAchievementDate = '-'
        if (oldestDate) {
          const sortedPatches = clone(PatchStore.getPatches).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          let nextPatchIndex = -1
          for (const [index, patch] of sortedPatches.entries()) {
            if (new Date(patch.date) > oldestDate) {
              nextPatchIndex = index
              break
            }
          }
          let userCreatedPatchTargetVersion: number = 0
          if (nextPatchIndex <= -1) {
            // 最新パッチユーザ
            userCreatedPatchVersin =
              sortedPatches[sortedPatches.length - 1].number
            userCreatedPatchTargetVersion =
              sortedPatches[sortedPatches.length - 1].targetVersion
          } else {
            if (nextPatchIndex === 0) {
              // Legacy User
              userCreatedPatchVersin = '1.X'
              userCreatedPatchTargetVersion = 1
            } else {
              console.log(nextPatchIndex)
              // その他ユーザ（いずれかのパッチ）
              const latestIndex = nextPatchIndex - 1
              userCreatedPatchVersin = sortedPatches[latestIndex].number
              userCreatedPatchTargetVersion =
                sortedPatches[latestIndex].targetVersion
            }
          }
          targetVersion = TARGET_VERSIONS.find((targetVersion) => {
            return targetVersion.version === userCreatedPatchTargetVersion
          })
          if (oldestDate && targetVersion) {
            oldestAchievementDate = `Since: ${(this as any).formatDate(
              oldestDate
            )}~ (${targetVersion.name}${
              userCreatedPatchVersin ? ':' : ''
            }${userCreatedPatchVersin})`
          }
        }
        return {
          fontSize: this.charaSinceFontSize,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          height: this.charaInfoHeight,
          fontStyle: `italic ${this.infoTextBold}`,
          fontFamily: this.charaInfoFontFamily,
          verticalAlign: 'middle',
          align: 'left',
          visible: visible,
          text: oldestAchievementDate,
        }
      },
      charaDataHeight(): number {
        return (
          this.charaNameFontSize + this.charaInfoHeight + this.charaNameMargin
        )
      },
      fcGroupY(): number {
        return this.charaDataHeight + this.charaNameMargin
      },
      fcInfoSize(): number {
        return this.fcNameSize + this.fcPositionSize + this.groupColumnMargin
      },
      configFcGroup(): Konva.NodeConfig {
        return {
          y: this.fcGroupY,
        }
      },
      configFcCrest(): Konva.ImageConfig {
        return {
          image: undefined,
          height: this.fcInfoSize,
          width: this.fcInfoSize,
        }
      },
      configFcName(): Konva.TextConfig {
        const fcName = this.responseData?.freecompanyInfo?.fcName ?? ''
        const fcTag = this.responseData?.freecompanyInfo?.fcTag ?? ''
        const fcInfo = `${fcName} ${fcTag}`
        return {
          x: this.fcInfoSize + this.groupRowMargin,
          fontSize: this.fcNameSize,
          fill: this.cardColor.textColor,
          fontFamily: this.charaInfoFontFamily,
          fontStyle: this.infoTextBold,
          text: fcInfo,
        }
      },
      imageFcPostiionImageUrl(): string {
        return this.responseData?.freecompanyInfo?.positionBaseImageUrl ?? ''
      },
      configImageFcPosition(): Konva.ImageConfig {
        return {
          image: undefined,
          x: this.fcInfoSize + this.groupRowMargin,
          y: this.fcNameSize + this.groupColumnMargin / 2,
          width: this.fcPositionSize,
          height: this.fcPositionSize,
        }
      },
      configTextFcPositon(): Konva.TextConfig {
        const fcPosition =
          this.responseData?.freecompanyInfo?.positionName ?? ''
        return {
          x: this.fcInfoSize + this.fcPositionSize + this.groupRowMargin,
          y: this.fcNameSize + this.groupColumnMargin,
          fontSize: this.fcPositionSize,
          fill: this.cardColor.textColor,
          fontFamily: this.charaInfoFontFamily,
          fontStyle: this.infoTextBold,
          text: fcPosition,
        }
      },
      configServerGroup(): Konva.NodeConfig {
        return {
          y: this.fcGroupY,
        }
      },
      dcImageSize(): number {
        return (
          this.dcNameFontSize + this.serverNameFontSize + this.groupColumnMargin
        )
      },
      configDcImage(): Konva.ImageConfig {
        return {
          image: undefined,
          height: this.dcImageSize,
          width: this.dcImageSize,
        }
      },
      configDcName(): Konva.TextConfig {
        return {
          x: this.dcImageSize + this.groupRowMargin,
          y: 4,
          fontSize: this.dcNameFontSize,
          fontFamily: this.charaInfoFontFamily,
          fill: this.cardColor.textColor,
          fontStyle: this.infoTextBold,
          align: 'left',
          text: this.responseData?.characterData.datacenter ?? '???',
        }
      },
      configServerName(): Konva.TextConfig {
        return {
          x: this.dcImageSize + this.groupRowMargin,
          y: this.dcNameFontSize + this.groupColumnMargin,
          fontSize: this.serverNameFontSize,
          fill: this.cardColor.textColor,
          fontStyle: this.infoTextBold,
          fontFamily: this.charaInfoFontFamily,
          align: 'left',
          text: this.responseData?.characterData.server ?? '???',
        }
      },
      descGroupY(): number {
        return this.fcGroupY + this.fcInfoSize + this.descGroupMargin
      },
      configDescGroup(): Konva.NodeConfig {
        return {
          y: this.descGroupY,
        }
      },
      configBorderTopDesc(): Konva.LineConfig {
        return {
          points: [0, 0, this.infoGroupWidth, 0],
          stroke: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          strokeWidth: this.lineStrokeSize,
        }
      },

      configDescription(): Konva.TextConfig {
        return {
          y: this.descMargin,
          fontSize: this.descriptionFontSize,
          fontStyle: this.infoTextBold,
          fontFamily: this.charaInfoFontFamily,
          text: this.description,
          // CharacterInfoStore.getResponseData?.characterData
          //   .selfintroduction ?? '',
          verticalAlign: 'middle',
          width: this.infoGroupWidth,
          height:
            this.descriptionFontSize *
            this.descLineHeight *
            this.descriptionRows,
          ellipsis: true,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          lineHeight: this.descLineHeight,
        }
      },
      configBorderBottomDesc(): Konva.LineConfig {
        return {
          y:
            this.descriptionFontSize *
              this.descLineHeight *
              this.descriptionRows +
            this.descMargin * 2,
          points: [0, 0, this.infoGroupWidth, 0],
          stroke: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          strokeWidth: this.lineStrokeSize,
        }
      },
      jobAchievementGroupY(): number {
        return (
          this.descGroupY +
          this.descriptionFontSize *
            this.descLineHeight *
            this.descriptionRows +
          this.descMargin * 2 +
          this.jobAchievementMargin
        )
      },
      jobAchievementWidth(): number {
        return this.infoGroupWidth / 2
      },
      configJobAchieveGroup(): Konva.NodeConfig {
        return {
          y: this.jobAchievementGroupY,
        }
      },
      configJobGroup(): Konva.NodeConfig {
        return {}
      },

      configAchievementGroup(): Konva.NodeConfig {
        return {
          x: this.jobAchievementWidth,
        }
      },

      configCopyright(): Konva.TextConfig {
        return {
          fontSize: this.copyrightFontSize,
          y: this.infoHeight - this.copyrightFontSize - this.infoMarginBottom,
          fontFamily: 'Open Sans',
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          text: '(C) SQUARE ENIX CO., LTD. All Rights Reserved.',
        }
      },
      charaUrlY(): number {
        return (
          this.infoHeight -
          this.copyrightFontSize -
          this.infoMarginBottom -
          this.charaUrlFontSize -
          this.footerMarginColumn
        )
      },
      configCharaUrl(): Konva.TextConfig {
        if (!CharacterInfoStore.getResponseData?.characterID) {
          return {}
        }
        const url = `${LOADSTONE_CHARACTER_URL}/${CharacterInfoStore.getResponseData?.characterID}`
        return {
          fontSize: this.charaUrlFontSize,
          y: this.charaUrlY,
          fontFamily: this.charaInfoFontFamily,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          text: url,
        }
      },
      configCharaUrlUnderline: {
        // 文字幅が変わることがあるため（measureSizeを利用する場合）、値をcacheしないようにする
        cache: false,
        get(): Konva.LineConfig {
          const textLength =
            this.getCharaUrl()?.measureSize(this.getCharaUrl()?.text() ?? '')
              .width ?? 0
          return {
            points: [0, 0, textLength, 0],
            y: this.charaUrlY + this.charaUrlFontSize,
            stroke: this.cardColor.textColor,
            opacity: secondaryOpacity,
            fontStyle: this.infoTextBold,
            strokeWidth: this.lineStrokeSize,
          }
        },
      },
      canvasHeight(): number {
        return this.canvasWidth * this.cardRatio
      },
      infoHeight(): number {
        return this.canvasHeight - this.infoMarginTop
      },
      canvasImageWidth(): number {
        return this.canvasWidth * this.cardRatio * this.mainImageRatio
      },
      containerStyle() {
        if (this.maxHeightPx <= 0) return
        return {
          'max-height': `${Math.ceil(this.maxHeightPx)}px`,
        }
      },
      isDisabledSizeCalc(): boolean {
        return (
          (this.$refs.container as Element).clientWidth <= 0 || !this.isShown
        )
      },
      responseData(): ResponseData | null {
        return CharacterInfoStore.getResponseData
      },
      fcImageSrcArray(): string[] {
        if (this.responseData && this.responseData.freecompanyInfo) {
          const backgroundImage = `${FORFAN_RESOURCES_URL}/img/fc_bg.png`
          const fcCrestImageUrls = clone(
            this.responseData.freecompanyInfo.fcCrestBaseImageUrls
          )
          fcCrestImageUrls.unshift(backgroundImage)
          return fcCrestImageUrls
        }
        return []
      },
    },
    watch: {
      croppedImage(val: HTMLImageElement, oldVal: HTMLImageElement) {
        console.log('watch.croppedImage.val', !!val)
        if (val) {
          if (oldVal) {
            this.removeMainImage()
          }
          this.setMainImage(val)
        } else {
          this.removeMainImage()
        }
      },
      isShown() {
        if (this.isShown) {
          this.fitStageIntoParentContainer()
        }
      },
      description() {
        this.getLayer()?.batchDraw()
      },
      cardColor: {
        handler() {
          this.getLayer()?.batchDraw()
        },
        deep: true,
      },
      isFullSizeImage() {
        this.updateCanvas()
      },
      charaNameFontFamily() {
        this.updateCanvas()
      },
      charaInfoFontFamily() {
        this.updateCanvas()
      },
      widthSpace() {
        this.updateCanvas()
      },
    },
    methods: {
      // refs getters
      getStage(): Konva.Stage | undefined {
        return (this.$refs.stage as any)?.getNode() as Konva.Stage
      },
      getLayer(): Konva.Layer | undefined {
        return (this.$refs.layer as any)?.getNode() as Konva.Layer
      },
      getGroup(): Konva.Group | undefined {
        return (this.$refs.group as any)?.getNode() as Konva.Group
      },
      getBackground(): Konva.Rect | undefined {
        return (this.$refs.background as any)?.getNode() as Konva.Rect
      },
      getMainImage(): Konva.Image | undefined {
        return (this.$refs.mainImage as any)?.getNode() as Konva.Image
      },
      getCharaName(): Konva.Text | undefined {
        return (this.$refs.charaName as any)?.getNode() as Konva.Text
      },
      getCharaData(): Konva.Text | undefined {
        return (this.$refs.charaData as any)?.getNode() as Konva.Text
      },
      getCharaSince(): Konva.Text | undefined {
        return (this.$refs.charaSince as any)?.getNode() as Konva.Text
      },
      getInfoGroup(): Konva.Group | undefined {
        return (this.$refs.infoGroup as any)?.getNode() as Konva.Group
      },
      getFcName(): Konva.Text | undefined {
        return (this.$refs.fcName as any)?.getNode() as Konva.Text
      },
      getFcPositionText(): Konva.Text | undefined {
        return (this.$refs.fcPositionText as any)?.getNode() as Konva.Text
      },
      getServerGroup(): Konva.Group | undefined {
        return (this.$refs.serverGroup as any)?.getNode() as Konva.Group
      },
      getDcImage(): Konva.Image | undefined {
        return (this.$refs.dcImage as any)?.getNode() as Konva.Image
      },
      getDcName(): Konva.Text | undefined {
        return (this.$refs.dcName as any)?.getNode() as Konva.Text
      },
      getServerName(): Konva.Text | undefined {
        return (this.$refs.serverName as any)?.getNode() as Konva.Text
      },
      getDescription(): Konva.Text | undefined {
        return (this.$refs.description as any)?.getNode() as Konva.Text
      },
      getCharaUrl(): Konva.Text | undefined {
        return (this.$refs.charaUrl as any)?.getNode() as Konva.Text
      },
      getCharaUrlUnderline(): Konva.Line | undefined {
        return (this.$refs.charaUrlUnderline as any)?.getNode() as Konva.Line
      },
      getCopyright(): Konva.Text | undefined {
        return (this.$refs.copyright as any)?.getNode() as Konva.Text
      },
      // TODO: componentsの型宣言ができるならここのanyを外したい
      getJobGroup(): any | undefined {
        return this.$refs.jobGroup as any
      },
      getAchievementGroup(): any | undefined {
        return this.$refs.achievementGroup as any
      },
      getScale(): number {
        const widthScale = this.getContainerWidth() / this.canvasWidth

        const heightScale = this.getContainerHeight() / this.canvasHeight
        return Math.min(widthScale, heightScale)
      },
      getContainerHeight(): number {
        let containerHeight = this.getContainerWidth() * this.cardRatio
        if (containerHeight > this.maxHeightPx) {
          containerHeight = this.maxHeightPx
        }
        return containerHeight
      },
      getContainerWidth(): number {
        if (this.isDisabledSizeCalc) return 0
        return (this.$refs.container as Element).clientWidth
      },
      // common methods
      initialize() {
        console.log('initalize')
        this.addEvementListener()
        this.fitStageIntoParentContainer()
        this.initializeBackgroundRect()
        if (this.isFontLoaded && !this.isCanvasSetuped) {
          this.updateCanvas()
        }
        this.initialized = true
        this.getLayer()?.batchDraw()
      },
      fitStageIntoParentContainer() {
        // Stageのサイズ調整
        this.scale = this.getScale()
        this.getStage()?.width(this.getContainerWidth())
        this.getStage()?.height(this.getContainerHeight())
        this.getStage()?.scale({ x: this.scale, y: this.scale })
        const scaledWidth = this.canvasWidth * this.scale
        const stageWidth = this.getStage()?.width()
        this.getLayer()?.x(
          stageWidth ? (stageWidth - scaledWidth) / 2 / this.scale : 0
        )
        this.$emit('scaleUpdated', this.scale)
        this.getLayer()?.batchDraw()
      },
      addEvementListener() {
        window.addEventListener('resize', this.fitStageIntoParentContainer)
      },
      clearEventListener() {
        window.removeEventListener('resize', this.fitStageIntoParentContainer)
      },
      updateCanvas() {
        this.updateText()
        this.getCharaUrlUnderline()?.setAttrs(this.configCharaUrlUnderline)
        // 右寄せ
        // DC/Server
        const serverTextLength = Math.max(
          this.getServerName()?.measureSize(this.getServerName()?.text() ?? '')
            .width ?? 0,
          this.getDcName()?.measureSize(this.getDcName()?.text() ?? '').width ??
            0
        )

        // CharaNameが超えないように
        while (
          this.infoGroupWidth <
          this.getCharaName()?.measureSize(this.getCharaName()?.text() ?? '')
            .width
        ) {
          this.getCharaName()?.fontSize(
            (this.getCharaName()?.fontSize() ?? 0) - 0.5
          )
        }

        // CharaDataをSinceが被らないように
        while (
          this.infoGroupWidth <
          this.getCharaData()?.measureSize(this.getCharaData()?.text() ?? '')
            .width +
            this.textMargin +
            this.getCharaSince()?.measureSize(
              this.getCharaSince()?.text() ?? ''
            ).width
        ) {
          this.getCharaData()?.fontSize(
            (this.getCharaData()?.fontSize() ?? 0) - 0.2
          )
          this.getCharaSince()?.fontSize(
            (this.getCharaSince()?.fontSize() ?? 0) - 0.2
          )
        }

        // CharaDataをSinceが被らないように
        while (
          this.infoGroupWidth <
          this.getCharaData()?.measureSize(this.getCharaData()?.text() ?? '')
            .width +
            this.textMargin +
            this.getCharaSince()?.measureSize(
              this.getCharaSince()?.text() ?? ''
            ).width
        ) {
          this.getCharaData()?.fontSize(
            (this.getCharaData()?.fontSize() ?? 0) - 0.25
          )
          this.getCharaSince()?.fontSize(
            (this.getCharaSince()?.fontSize() ?? 0) - 0.25
          )
        }

        this.getServerGroup()?.x(
          this.infoGroupWidth -
            serverTextLength -
            this.groupRowMargin -
            this.dcImageSize
        )
        // 開始時期
        this.getCharaSince()?.x(
          this.infoGroupWidth -
            (this.getCharaSince()?.measureSize(
              this.getCharaSince()?.text() ?? ''
            ).width ?? 0)
        )
        this.getJobGroup()?.setWidth(this.jobAchievementWidth)
        this.getJobGroup()?.updateCanvas()
        this.getAchievementGroup()?.setWidth(this.jobAchievementWidth)
        this.getAchievementGroup()?.updateCanvas()
        this.getLayer()?.batchDraw()
        this.isCanvasSetuped = true
      },
      updateText() {
        this.getCharaName()?.setAttrs(this.configCharaName)
        this.getCharaData()?.setAttrs(this.configCharaData)
        this.getCharaSince()?.setAttrs(this.configCharaSince)
        this.getFcName()?.setAttrs(this.configFcName)
        this.getFcPositionText()?.setAttrs(this.configTextFcPositon)
        this.getDcName()?.setAttrs(this.configDcName)
        this.getServerName()?.setAttrs(this.configServerName)
        this.getDescription()?.setAttrs(this.configDescription)
        this.getCharaUrl()?.setAttrs(this.configCharaUrl)
        this.getLayer()?.batchDraw()
      },
      getGroupBlobUrl(): string {
        const baseHeight = Math.abs(this.canvasHeight)
        const baseWidth = Math.abs(this.canvasWidth)
        let outputScale = this.canvasWidth / Math.max(baseHeight, baseWidth)
        if (isNaN(outputScale) || outputScale < 1) {
          outputScale = 1
        }
        const cloneStage = this.getStage()?.clone({
          scaleX: 1,
          scaleY: 1,
          // this.scale
        })
        const dataUrl = cloneStage.findOne('.outputGroup').toDataURL({
          mimeType: `image/png`,
          pixelRatio: outputScale,
          height: baseHeight,
          width: baseWidth,
        })

        cloneStage.destroy()
        return dataUrl
      },
      //TODO: forfan-common-vueで共通化できそう
      saveImage() {
        if (!this.mainImage) {
          this.$emit(OUTPUT_SNACKBAR, {
            text: 'メイン画像が選択されていません。',
            color: 'error',
          })
          return
        }
        const dataURL = this.getGroupBlobUrl()
        if (!dataURL) {
          this.$emit(OUTPUT_SNACKBAR, {
            text: 'INTERNAL_ERROR: blobURLの取得に失敗しました',
            color: 'error',
          })
          return
        }
        // 2MB以上の画像がダウンロードできないので、ここで対応。
        // 参考: http://var.blog.jp/archives/71618647.html
        const b64 = atob(dataURL.split(',')[1])
        const u8 = Uint8Array.from(b64.split(''), (e) => e.charCodeAt(0))
        const blob = new Blob([u8], { type: 'image/png' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `chara_card.png`
        link.href = url
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
          link.remove()
          URL.revokeObjectURL(url)
        }, Math.max(3000, ((1000 * dataURL.length) / 1024) * 1024))
      },
      redrawCanvas() {
        this.getLayer()?.batchDraw()
      },
      // Background Rect
      initializeBackgroundRect() {
        this.getBackground()?.width(this.canvasWidth)
        this.getBackground()?.height(this.canvasWidth * this.cardRatio)
      },
      // Main Image
      setMainImage(image: HTMLImageElement) {
        this.mainImage = image
        this.getLayer()?.batchDraw()
      },
      removeMainImage() {
        this.mainImage = undefined
        this.getMainImage()?.image(undefined)
        this.getLayer()?.batchDraw()
      },
    },
  })
</script>

<style lang="scss" scoped>
  .canvas {
    width: 100%;
  }
</style>
