<template>
  <v-group ref="jobGroup" :config="config">
    <job-achievement-header
      :iconName="headerIconName"
      :headerHeight="headerHeight"
      text="Jobs"
      :width="innerValWidth"
    ></job-achievement-header>
    <v-group>
      <v-group ref="jobListGroup" :config="configJobContent">
        <!-- <v-text :config="configMainJobLabel"></v-text>
        <v-group v-if="mainJob" ref="mainJobGroup" :config="configMainJobGroup">
          <v-async-image
            :src="getImagePath(mainJob)"
            :config="configMainJobImg"
          ></v-async-image>
          <v-text :config="configMainJobLevel"></v-text>
          <v-group :config="configMainJobInfoGroup">
            <v-text :config="configMainJobName"></v-text>
            <v-text :config="asyncConfigMainJobSince"></v-text>
          </v-group>
        </v-group> -->
        <v-group :config="configTankListJobGroup">
          <v-group :config="configListJobItems">
            <v-group v-for="(tank, index) in tankWithLevel" :key="index">
              <v-async-image
                :src="getImagePath(tank)"
                :config="getConfigListJobImg(index)"
              ></v-async-image>
              <v-text
                ref="tankLevel"
                :config="getConfigListJobLevel(tank, index)"
              ></v-text>
            </v-group>
          </v-group>
        </v-group>
        <v-group :config="configHealerListJobGroup">
          <v-group :config="configListJobItems">
            <v-group v-for="(healer, index) in healerWithLevel" :key="index">
              <v-async-image
                :src="getImagePath(healer)"
                :config="getConfigListJobImg(index)"
              ></v-async-image>
              <v-text
                ref="healerLevel"
                :config="getConfigListJobLevel(healer, index)"
              ></v-text>
            </v-group>
          </v-group>
        </v-group>
        <v-group :config="configDPSListJobGroup">
          <v-group :config="configListJobItems">
            <v-group v-for="(dps, index) in dpsWithLevel" :key="index">
              <v-async-image
                :src="getImagePath(dps)"
                :config="getConfigListJobImg(index)"
              ></v-async-image>
              <v-text
                ref="dpsLevel"
                :config="getConfigListJobLevel(dps, index)"
              ></v-text>
            </v-group>
          </v-group>
        </v-group>
        <v-group :config="configCrafterListJobGroup">
          <v-group :config="configListJobItems">
            <v-group v-for="(crafter, index) in crafterWithLevel" :key="index">
              <v-async-image
                :src="getImagePath(crafter)"
                :config="getConfigListJobImg(index)"
              ></v-async-image>
              <v-text
                ref="crafterLevel"
                :config="getConfigListJobLevel(crafter, index)"
              ></v-text>
            </v-group>
          </v-group>
        </v-group>
        <v-group :config="configGathererListJobGroup">
          <v-group :config="configListJobItems">
            <v-group
              v-for="(gatherer, index) in gathererWithLevel"
              :key="index"
            >
              <v-async-image
                :src="getImagePath(gatherer)"
                :config="getConfigListJobImg(index)"
              ></v-async-image>
              <v-text
                ref="gathererLevel"
                :config="getConfigListJobLevel(gatherer, index)"
              ></v-text>
            </v-group>
          </v-group>
        </v-group>
      </v-group>
    </v-group>
  </v-group>
</template>
<script lang="ts">
  import Vue, { PropType } from 'vue'
  import Konva from 'konva'
  import jobAchievementHeader from '~/components/characterCard/molecules/JobAchievementHeader.vue'
  import VAsyncImage from '~/components/characterCard/molecules/VAsyncImage.vue'
  import { CharacterInfoStore, SelectedCharaInfoStore } from '~/store'
  import { DateMixin } from '@murofush/forfan-common-vue'

  import achievementMixin from '~/mixins/achievement'
  import characterJobsMixin from '~/mixins/characterJobs'
  import { BattleRoles } from '@murofush/forfan-common-package/lib/types'
  import { secondaryOpacity } from '~/common/const'
  import canvasComponentsMixin from '~/mixins/canvasComponents'

  export default Vue.extend({
    components: {
      jobAchievementHeader,
      VAsyncImage,
    },
    data() {
      return {
        rowItemLength: 6,
        asyncConfigMainJobSince: {} as Konva.TextConfig,
        headerIconName: `job`,
        jobLevelFontFamily: 'Roboto Condensed',
      }
    },
    mixins: [
      achievementMixin,
      DateMixin,
      characterJobsMixin,
      canvasComponentsMixin,
    ],
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
    async mounted() {
      // await this.setConfigMainJobSince()
    },
    computed: {
      itemWidth(): number {
        return (
          this.listJobImageSize + this.listJobLevelFontSize + this.jobRowMargin
        )
      },
      itemHeight(): number {
        return this.listJobImageSize + this.jobColumnMargin
      },
      theme(): Theme {
        return SelectedCharaInfoStore.getTheme
      },
      infoTextBold(): string {
        return SelectedCharaInfoStore.getInfoTextBold ? 'bold' : ''
      },
      cardColor(): CardColor {
        return SelectedCharaInfoStore.getCardColor
      },
      charaInfoFontFamily(): string {
        return SelectedCharaInfoStore.getCharaInfoFontFamily
      },
      jobGroupMargin(): number {
        return this.headerHeight * 0.45
      },
      jobRowMargin(): number {
        return this.headerHeight * 0.2
      },
      jobColumnMargin(): number {
        return this.headerHeight * 0.05
      },
      textMargin(): number {
        return this.headerHeight * 0.1
      },
      labelFontSize(): number {
        return this.headerHeight * 0.4
      },
      mainImageSize(): number {
        return this.headerHeight * 1.1
      },
      mainJobLevelFontSize(): number {
        return this.mainImageSize * 0.9
      },
      mainJobNameFontSize(): number {
        return this.mainImageSize * 0.5
      },
      mainJobSinceFontSize(): number {
        return this.mainImageSize * 0.4
      },
      listJobImageSize(): number {
        return this.headerHeight * 0.8
      },
      listJobLevelFontSize(): number {
        return this.listJobImageSize * 0.8
      },
      configJobContent(): Konva.NodeConfig {
        return {
          y: this.headerHeight + this.jobGroupMargin,
        }
      },
      configMainJobLabel(): Konva.TextConfig {
        return {
          text: 'Main Job',
          fill: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          fontSize: this.labelFontSize,
        }
      },
      configMainJobImg(): Konva.ImageConfig {
        return {
          image: undefined,
          width: this.mainImageSize,
          height: this.mainImageSize,
        }
      },
      // configMainJobLevel(): Konva.TextConfig {
      //   if (!this.mainJob) {
      //     return {}
      //   }
      //   const job = this.checkClass(this.mainJob)
      //   let fontColor = this.getLevelFontColor(job)
      //   return {
      //     verticalAlign: 'middle',
      //     align: 'right',
      //     fontFamily: 'Roboto Condensed',
      //     fontStyle: 'bold',
      //     width: this.mainJobLevelFontSize,
      //     height: this.mainImageSize,
      //     fill: fontColor,
      //     x: this.mainImageSize,
      //     y: this.textMargin,
      //     text: job.level.toString(),
      //     fontSize: this.mainJobLevelFontSize,
      //   }
      // },
      mainJobGroupY(): number {
        return this.labelFontSize
      },
      configMainJobGroup(): Konva.NodeConfig {
        return {
          y: this.mainJobGroupY,
        }
      },
      configMainJobInfoGroup(): Konva.NodeConfig {
        return {
          x: this.mainImageSize + this.mainJobLevelFontSize + this.textMargin,
          y: this.textMargin,
        }
      },
      // configMainJobName(): Konva.TextConfig {
      //   if (!this.mainJob) {
      //     return {}
      //   }
      //   const job = this.checkClass(this.mainJob)
      //   return {
      //     text: job.name,
      //     fontSize: this.mainJobNameFontSize,
      //   }
      // },
      configListJobItems(): Konva.NodeConfig {
        return { y: 0 }
      },
      tankGroupY(): number {
        // MainJob をヘッダーに配置する場合
        // return this.mainJobGroupY + this.mainImageSize + this.jobGroupMargin

        // その他
        return 0
      },
      configTankListJobGroup(): Konva.NodeConfig {
        return {
          y: this.tankGroupY,
        }
      },
      healerGroupY(): number {
        return (
          this.tankGroupY +
          this.listJobImageSize +
          this.itemHeight *
            Math.floor(
              (this as any).tankWithLevel.length / this.rowItemLength
            ) +
          // this.labelFontSize +
          this.jobGroupMargin
        )
      },
      configHealerListJobGroup(): Konva.NodeConfig {
        return {
          y: this.healerGroupY,
        }
      },
      dpsGroupY(): number {
        return (
          this.healerGroupY +
          this.listJobImageSize +
          this.itemHeight *
            Math.floor(
              (this as any).healerWithLevel.length / this.rowItemLength
            ) +
          // this.labelFontSize +
          this.jobGroupMargin
        )
      },
      configDPSListJobGroup(): Konva.NodeConfig {
        return {
          y: this.dpsGroupY,
        }
      },
      crafterGroupY(): number {
        return (
          this.dpsGroupY +
          this.listJobImageSize +
          this.itemHeight *
            Math.floor((this as any).dpsWithLevel.length / this.rowItemLength) +
          // this.labelFontSize +
          this.jobGroupMargin
        )
      },
      configCrafterListJobGroup(): Konva.NodeConfig {
        return {
          y: this.crafterGroupY,
        }
      },
      gathererGroupY(): number {
        return (
          this.crafterGroupY +
          this.listJobImageSize +
          this.itemHeight *
            Math.floor(
              (this as any).crafterWithLevel.length / this.rowItemLength
            ) +
          // this.labelFontSize +
          this.jobGroupMargin
        )
      },
      configGathererListJobGroup(): Konva.NodeConfig {
        return {
          y: this.gathererGroupY,
        }
      },
      battleJobWithLevel(): BattleRoles<JobWithLevel> | null {
        return CharacterInfoStore.getBattleJobWithLevel
      },
    },
    methods: {
      // async setConfigMainJobSince() {
      //   if (!this.mainJob) {
      //     return {}
      //   }
      //   const title = this.mainJob.sourceClass
      //     ? this.mainJob.sourceClass.name
      //     : this.mainJob.name
      //   const level = Math.ceil(this.mainJob.level / 10) * 10
      //   const achievementTitle = `${title}：レベル${level}`
      //   const data: CompletedAchievement | undefined = await (
      //     this as any
      //   ).getAchievementByTitle('character', achievementTitle)
      //   if (data && data.completedDate) {
      //     const fmtDate = (this as any).formatDate(new Date(data.completedDate))
      //     const outputText = `Lv${level}: ${fmtDate}~`
      //     this.asyncConfigMainJobSince = {
      //       y: this.mainJobNameFontSize,
      //       fill: this.cardColor.textColor,
      //       opacity: secondaryOpacity,
      //       fontStyle: this.infoTextBold,
      //       text: outputText,
      //       fontSize: this.mainJobSinceFontSize,
      //     }
      //   }
      // },
      getJobGroup(): Konva.Group | undefined {
        return (this.$refs.jobGroup as any)?.getNode() as Konva.Group
      },
      getJobListGroup(): Konva.Group | undefined {
        return (this.$refs.jobListGroup as any)?.getNode() as Konva.Group
      },
      getLevelText(label: string, index: number): Konva.Text | undefined {
        return (
          (this.$refs[`${label}Level`] as Element[] | undefined)?.[index] as any
        ).getNode() as Konva.Text
      },

      updateCanvas() {
        // Tank
        ;(this as any).tankWithLevel.forEach(
          (tank: JobWithLevel, index: number) => {
            this.getLevelText('tank', index)?.setAttrs(
              this.getConfigListJobLevel(tank, index)
            )
          }
        )

        // Healer
        ;(this as any).healerWithLevel.forEach(
          (healer: JobWithLevel, index: number) => {
            this.getLevelText('healer', index)?.setAttrs(
              this.getConfigListJobLevel(healer, index)
            )
          }
        )

        // DPS
        ;(this as any).dpsWithLevel.forEach(
          (dps: JobWithLevel, index: number) => {
            this.getLevelText('dps', index)?.setAttrs(
              this.getConfigListJobLevel(dps, index)
            )
          }
        )

        // Crafter
        ;(this as any).crafterWithLevel.forEach(
          (crafter: JobWithLevel, index: number) => {
            this.getLevelText('crafter', index)?.setAttrs(
              this.getConfigListJobLevel(crafter, index)
            )
          }
        )

        // Gatherer
        ;(this as any).gathererWithLevel.forEach(
          (gatherer: JobWithLevel, index: number) => {
            this.getLevelText('gatherer', index)?.setAttrs(
              this.getConfigListJobLevel(gatherer, index)
            )
          }
        )
        const scale = Math.min(
          1,
          (this as any).innerValWidth / (this.itemWidth * this.rowItemLength)
        )
        this.getJobListGroup()?.scale({ x: scale, y: scale })
      },
      getListJobMarginY(index: number): number {
        return this.itemHeight * Math.floor(index / this.rowItemLength)
      },
      getListJobMarginX(index: number): number {
        return this.itemWidth * (index % this.rowItemLength)
      },
      getConfigListJobImg(index: number): Konva.ImageConfig {
        return {
          image: undefined,
          y: this.getListJobMarginY(index),
          width: this.listJobImageSize,
          height: this.listJobImageSize,
          x: this.getListJobMarginX(index),
        }
      },
      getConfigListJobLevel(
        job: JobWithLevel,
        index: number
      ): Konva.TextConfig {
        let fontColor = this.getLevelFontColor(job)
        const config = {
          verticalAlign: 'middle',
          align: 'right',
          fontFamily: this.jobLevelFontFamily,
          fontStyle: 'bold',
          fontSize: this.listJobLevelFontSize,
          text: job.level.toString(),
          fill: fontColor,
          y: this.getListJobMarginY(index),

          height: this.listJobImageSize,
          x: this.listJobImageSize + this.getListJobMarginX(index),
        } as Konva.TextConfig

        if (!(this as any).isLevelMax(job)) {
          config.opacity = secondaryOpacity
        }

        const calcText = new Konva.Text(config)
        config.width = calcText.measureSize('00').width
        return config
      },
      getLevelFontColor(job: JobWithLevel) {
        return (this as any).isLevelMax(job)
          ? this.cardColor.accentColor
          : this.cardColor.textColor
      },
    },
  })
</script>
<style lang="scss" scoped></style>
