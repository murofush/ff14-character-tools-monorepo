<template>
  <v-group ref="achievementGroup" :config="config">
    <job-achievement-header
      :iconName="headerIconName"
      :headerHeight="headerHeight"
      :config="config"
      text="Achievements"
      :width="innerValWidth"
    ></job-achievement-header>
    <template v-if="selectedAchievements.length > 0">
      <v-group
        :config="getConfigAchievementGroup(index)"
        v-for="(achievement, index) in selectedAchievements"
        :key="index"
      >
        <v-async-image
          ref="achievementImage"
          :src="getAchievementIconUrl(achievement)"
          :config="configAchievementIcon"
        ></v-async-image>
        <v-async-image
          ref="achievementImage"
          :src="frameImgSrc"
          :config="configAchievementFrame"
        ></v-async-image>
        <v-group :config="configAchievementInfo">
          <v-text
            ref="achievementTitle"
            :config="getConfigAchievementTitle(achievement)"
          ></v-text>
          <v-text
            ref="achievementDate"
            :config="getConfigAchievementDate(achievement)"
          ></v-text>
          <v-text
            ref="achievementDescription"
            :config="getConfigAchievementDescription(achievement)"
          ></v-text>
          <v-group :config="configAchievementAwardGroup">
            <template
              v-if="
                achievement.data.titleAward ||
                (achievement.data.titleAwardMan &&
                  achievement.data.titleAwardWoman)
              "
            >
              <v-text
                ref="achievementAward"
                :config="getConfigtTitleAward(achievement)"
              ></v-text>
            </template>
            <template
              v-if="
                achievement.data.itemAward &&
                achievement.data.itemAwardImagePath
              "
            >
              <v-text :config="getConfigtItemAwardName(achievement)"></v-text>
            </template>
          </v-group>
        </v-group>
      </v-group>
    </template>
    <template v-else>
      <v-text ref="noSelectedText" :config="configNoSelectedText"></v-text>
    </template>
  </v-group>
</template>
<script lang="ts">
  import Vue, { PropType } from 'vue'
  import Konva from 'konva'
  import VAsyncImage from '~/components/characterCard/molecules/VAsyncImage.vue'
  import jobAchievementHeader from '~/components/characterCard/molecules/JobAchievementHeader.vue'
  import { FORFAN_RESOURCES_URL } from '@murofush/forfan-common-package/lib/const'
  import {
    CharacterInfoStore,
    PatchStore,
    SelectedCharaInfoStore,
  } from '~/store'
  import { ImgMixin, DateMixin, PatchMixin } from '@murofush/forfan-common-vue'
  import { maxAchievementCount, secondaryOpacity } from '~/common/const'
  import { Patch } from '@murofush/forfan-common-package/lib/types'
  import canvasComponentsMixin from '~/mixins/canvasComponents'

  export default Vue.extend({
    components: {
      jobAchievementHeader,
      VAsyncImage,
    },
    mixins: [ImgMixin, DateMixin, PatchMixin, canvasComponentsMixin],
    props: {
      config: {
        type: Object as PropType<Konva.NodeConfig>,
        default: {},
      },
      headerHeight: {
        type: Number,
        required: true,
      },
    },
    data() {
      return {
        frameImgSrc: `${FORFAN_RESOURCES_URL}/img/frame.png`,
        headerIconName: `achievement`,
      }
    },
    watch: {
      disabledBeforeUnlockAccent() {
        this.updateCanvas()
        this.getAchievementGroup()?.getLayer()?.batchDraw()
      },
    },
    computed: {
      cardColor(): CardColor {
        return SelectedCharaInfoStore.getCardColor
      },
      infoTextBold(): string {
        return SelectedCharaInfoStore.getInfoTextBold ? 'bold' : ''
      },
      charaInfoFontFamily(): string {
        return SelectedCharaInfoStore.getCharaInfoFontFamily
      },
      disabledBeforeUnlockAccent(): boolean {
        return SelectedCharaInfoStore.getDisabledBeforeUnlockAccent
      },
      topContentMargin(): number {
        return this.imageSize * 0.4
      },
      achievementMargin(): number {
        return this.imageSize * 0.5
      },
      textMargin(): number {
        return this.imageSize * 0.05
      },
      titleFontSize(): number {
        return this.imageSize * 0.45
      },
      descriptionFontSize(): number {
        return this.imageSize * 0.35
      },
      complitedDateFontSize(): number {
        return this.imageSize * 0.45
      },
      AwardSize(): number {
        return this.imageSize * 0.325
      },
      imageSize(): number {
        return this.headerHeight
      },
      frameSize(): number {
        return this.imageSize * 1.2
      },
      nonSelectedFontSize(): number {
        return this.headerHeight * 0.7
      },
      headerY(): number {
        return this.headerHeight + this.topContentMargin
      },
      achievementItemHeight(): number {
        return (
          this.frameSize +
          this.AwardSize +
          this.textMargin +
          this.achievementMargin
        )
      },
      selectedAchievements(): AchievementDataWithIndex[] {
        return SelectedCharaInfoStore.getAchievements
      },
      configAchievementFrame(): Konva.ImageConfig {
        return {
          image: undefined,
          width: this.frameSize,
          height: this.frameSize,
        }
      },
      achievementIconPosition(): number {
        return (this.frameSize - this.imageSize) / 2
      },
      configAchievementIcon(): Konva.ImageConfig {
        return {
          image: undefined,
          width: this.imageSize,
          height: this.imageSize,
          x: this.achievementIconPosition,
          y: this.achievementIconPosition,
        }
      },
      achievementInfoX(): number {
        return this.frameSize + this.textMargin
      },
      configAchievementInfo(): Konva.NodeConfig {
        return {
          x: this.achievementInfoX,
        }
      },
      descriptionHeight(): number {
        return this.descriptionFontSize * 2
      },
      descriptionY(): number {
        return this.titleFontSize + this.textMargin
      },
      awardY(): number {
        return (
          this.descriptionY + this.descriptionFontSize * 2 + this.textMargin
        )
      },
      configAchievementAwardGroup(): Konva.NodeConfig {
        return {
          y: this.awardY,
        }
      },
      configItemAwardImage(): Konva.ImageConfig {
        return {
          image: undefined,
          width: this.AwardSize,
          height: this.AwardSize,
        }
      },
      configNoSelectedText(): Konva.TextConfig {
        return {
          text: 'No Selected.',
          fontFamily: this.charaInfoFontFamily,
          fontSize: this.nonSelectedFontSize,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          verticalAlign: 'middle',
          y: this.headerY,
          height: this.achievementItemHeight * maxAchievementCount,
          width: (this as any).innerValWidth,
          align: 'center',
        }
      },
    },
    methods: {
      getPatchById(id: number): Patch | null {
        return (this as any).getPatchByIdProcess(PatchStore.getPatches, id)
      },
      isUnlockBeforeAdjust(achievement: AchievementDataWithIndex): boolean {
        const adjustmentData = this.getAdjustmentPatch(achievement)
        if (adjustmentData && adjustmentData.date) {
          if (achievement.data.completedDate) {
            return (
              new Date(achievement.data.completedDate) <
                new Date(adjustmentData.date) &&
              !this.disabledBeforeUnlockAccent
            )
          }
        }
        return false
      },
      getAdjustmentPatch(achievement: AchievementDataWithIndex): Patch | null {
        if (achievement.data.adjustmentPatchId) {
          return this.getPatchById(achievement.data.adjustmentPatchId)
        }
        return null
      },
      getAchievementGroup(): Konva.Group | undefined {
        return (this.$refs.achievementGroup as any)?.getNode() as Konva.Group
      },
      getAchievementDate(index: number): Konva.Text | undefined {
        return (
          (this.$refs.achievementDate as Element[] | undefined)?.[index] as any
        )?.getNode() as Konva.Text
      },
      getAchievementTitle(index: number): Konva.Text | undefined {
        return (
          (this.$refs.achievementTitle as Element[] | undefined)?.[index] as any
        )?.getNode() as Konva.Text
      },
      getAchievementDescription(index: number): Konva.Text | undefined {
        return (
          (this.$refs.achievementDescription as Element[] | undefined)?.[
            index
          ] as any
        )?.getNode() as Konva.Text
      },
      getAchievementAward(index: number): Konva.Text | undefined {
        return (
          (this.$refs.achievementAward as Element[] | undefined)?.[index] as any
        )?.getNode() as Konva.Text
      },
      getNoSelectedText(): Konva.Text | undefined {
        return (this.$refs.noSelectedText as any)?.getNode() as Konva.Text
      },
      updateCanvas() {
        this.selectedAchievements?.forEach(
          (achievementIndex: AchievementDataWithIndex, index: number) => {
            const title = this.getAchievementTitle(index)
            this.getAchievementTitle(index)?.setAttrs(
              this.getConfigAchievementTitle(achievementIndex)
            )
            const desc = this.getAchievementDescription(index)
            desc?.setAttrs(
              this.getConfigAchievementDescription(achievementIndex)
            )
            const date = this.getAchievementDate(index)
            date?.setAttrs(this.getConfigAchievementDate(achievementIndex))
            this.getAchievementAward(index)?.setAttrs(
              this.getConfigtTitleAward(achievementIndex)
            )
            const infoWidth =
              (this as any).innerValWidth - this.achievementInfoX
            date?.x(infoWidth - date.width())
            // タイトルがDateに被らないように調整する
            while (
              infoWidth <
              (title?.width() ?? 0) + (date?.width() ?? 0) + this.textMargin
            ) {
              title?.fontSize(title?.fontSize() ?? 0 - 0.5)
            }
          }
        )
        this.getNoSelectedText()?.setAttrs(this.configNoSelectedText)
      },
      getAchievementIconUrl(
        achievement: AchievementDataWithIndex
      ): string | undefined {
        if (achievement.data.iconPath) {
          return (this as any).getIconFromUrl(achievement.data.iconPath)
        } else {
          console.error('INTERNAL_ERROR: iconPathが取得されていません')
        }
      },
      getItemAwardImagePath(
        achievement: AchievementDataWithIndex
      ): string | undefined {
        if (achievement && achievement.data.itemAwardImagePath) {
          return (this as any).getIconFromUrl(
            achievement.data.itemAwardImagePath
          )
        } else {
          console.error('INTERNAL_ERROR: iconPathが取得されていません')
        }
      },
      getConfigAchievementGroup(index: number): Konva.NodeConfig {
        return {
          y: this.headerY + this.achievementItemHeight * index,
        }
      },
      getConfigAchievementTitle(
        achievement: AchievementDataWithIndex
      ): Konva.TextConfig {
        return {
          text: achievement.data.title,
          height: this.titleFontSize,
          verticalAlign: 'middle',
          fontFamily: this.charaInfoFontFamily,
          fontStyle: this.infoTextBold,
          fill: this.cardColor.textColor,
          fontSize: this.titleFontSize,
        }
      },
      getConfigAchievementDate(
        achievement: AchievementDataWithIndex
      ): Konva.TextConfig {
        const complitedDate = achievement.data.completedDate
        let fmtComplitedDate = ''
        if (complitedDate) {
          fmtComplitedDate = (this as any).formatDate(new Date(complitedDate))
          if (this.isUnlockBeforeAdjust(achievement)) {
            fmtComplitedDate = '★' + fmtComplitedDate
            console.log(fmtComplitedDate)
          }
        }
        const fontColor = this.isUnlockBeforeAdjust(achievement)
          ? this.cardColor.accentColor
          : this.cardColor.textColor
        const config = {
          text: fmtComplitedDate,
          fontFamily: this.charaInfoFontFamily,
          fontStyle: this.infoTextBold,
          fill: fontColor,
          height: this.titleFontSize,
          verticalAlign: 'middle',
          fontSize: this.complitedDateFontSize,
        } as Konva.TextConfig
        if (!this.isUnlockBeforeAdjust(achievement)) {
          config.opacity = secondaryOpacity
        }
        return config
      },
      getConfigAchievementDescription(
        achievement: AchievementDataWithIndex
      ): Konva.TextConfig {
        return {
          text: achievement.data.description,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          height: this.descriptionFontSize * 2,
          fontFamily: this.charaInfoFontFamily,
          verticalAlign: 'middle',
          ellipsis: true,
          width:
            (this as any).innerValWidth +
            this.textMargin -
            this.headerHeight * 2,
          fontSize: this.descriptionFontSize,
          y: this.descriptionY,
        }
      },

      getConfigtTitleAward(
        achievement: AchievementDataWithIndex
      ): Konva.TextConfig {
        if (
          !(
            achievement.data.titleAward ||
            (achievement.data.titleAwardMan && achievement.data.titleAwardWoman)
          )
        ) {
          return {}
        }
        let title = ''
        if (achievement.data.titleAward) {
          title = `${achievement.data.titleAward}`
        } else if (
          CharacterInfoStore.getResponseData?.characterData.gender === '♂' &&
          achievement.data.titleAwardMan
        ) {
          title = `${achievement.data.titleAwardMan}`
        } else if (
          CharacterInfoStore.getResponseData?.characterData.gender === '♀' &&
          achievement.data.titleAwardWoman
        ) {
          title = `${achievement.data.titleAwardWoman}`
        }
        return {
          text: `Title:  <${title}>`,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontFamily: this.charaInfoFontFamily,
          fontStyle: 'italic bold',
          width:
            (this as any).innerValWidth +
            this.textMargin -
            this.headerHeight * 2,
          fontSize: this.AwardSize,
        }
      },
      getConfigtItemAwardName(
        achievement: AchievementDataWithIndex
      ): Konva.TextConfig {
        if (!achievement.data.itemAward) {
          return {}
        }
        return {
          text: `Item:  ${achievement.data.itemAward}`,
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontFamily: this.charaInfoFontFamily,
          fontStyle: 'italic bold',
          width:
            (this as any).innerValWidth +
            this.textMargin -
            this.headerHeight * 2,
          fontSize: this.AwardSize,
        }
      },
    },
  })
</script>
<style lang="scss" scoped></style>
