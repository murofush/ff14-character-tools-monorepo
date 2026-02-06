<template>
  <v-hover v-slot="{ hover }">
    <v-card
      class="text-center user_select_disable achievement-card"
      :elevation="getCardElevation(hover)"
      :outlined="!achievement.isCompleted"
      @click="clickAchievement"
      :tile="tile"
      :ripple="!isSelected && !simplicity"
      :disabled="!achievement.isCompleted"
      :color="achievementCardColor"
      :width="width"
      :height="height"
      :max-width="maxWidth"
    >
      <v-card-title>
        <v-row no-gutters align="center">
          <v-col cols="auto">
            <achievement-icon
              :icon-path="achievement.iconPath"
              :icon-url="achievement.iconUrl"
              :image-size="40"
              class="mr-1"
            ></achievement-icon>
          </v-col>
          <v-col class="title_container">
            <span
              :class="{ simplicity_title: simplicity }"
              :style="{
                fontSize: simplicity ? '1rem' : '1.25rem',
              }"
              >{{ achievement.title }}</span
            >
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text>
        {{ !simplicity ? achievement.description : hierarchy }}
      </v-card-text>
      <div class="caption" v-if="!simplicity" :style="unlockBeforeAdjustStyle">
        {{ fmtComplitedDate }}
      </div>
      <v-row
        no-gutters
        justify="center"
        align="center"
        v-if="achievement.titleAward && !simplicity"
        class="pb-1"
      >
        <v-col cols="12">
          <v-divider class="pb-1"></v-divider>
        </v-col>
        <v-col cols="auto">
          <span class="caption">称号:&ensp; </span>
        </v-col>
        <v-col cols="auto">
          <span class="subtitle-1">{{ achievement.titleAward }}</span>
        </v-col>
      </v-row>
      <div
        v-if="
          (achievement.titleAwardMan || achievement.titleAwardWoman) &&
          !simplicity
        "
        class="pb-1"
      >
        <v-divider class="pb-1"></v-divider>
        <span class="caption">称号:&ensp;</span><br />
        <span class="subtitle-1">
          男性: {{ achievement.titleAwardMan }} <br />
          女性: {{ achievement.titleAwardWoman }}
        </span>
      </div>
      <div class="pb-1" v-if="itemAwardObject && !simplicity">
        <v-divider class="pb-1"></v-divider>
        <span class="caption">アイテム</span>
        <item-viewer
          v-model="itemAwardObject"
          :load-local-img="achievement.isNowCreated"
        ></item-viewer>
      </div>
      <!-- <div v-if="achievement.tagIds.length > 0 && !simplicity">
        <v-divider class="pb-1"></v-divider>
        <span class="caption">タグ：&ensp;</span>
        <v-chip
          v-for="tagId in achievement.tagIds"
          :key="tagId"
          :color="getTagById(tagId).color"
          class="mr-1 mb-1"
        >
          <image-icon
            :icon-path="getTagById(tagId).iconPath"
            :image-size="24"
            :rounded="!getTagById(tagId).flatIcon"
            class="mr-1"
          ></image-icon>
          {{ getTagById(tagId).name }}
        </v-chip>
      </div> -->
      <v-row
        no-gutters
        justify="center"
        align="center"
        class="py-1"
        v-if="achievement.adjustmentPatchId && adjustmentPatch && !simplicity"
        :style="unlockBeforeAdjustStyle"
      >
        <v-col cols="12">
          <v-divider class="py-1"></v-divider>
        </v-col>
        <v-col cols="auto" class="caption">緩和パッチ：&ensp;</v-col>
        <v-col cols="auto" class="text-left d-inline">
          <div class="subtitle-2">
            {{ adjustmentPatch.number }} - {{ adjustmentPatch.subtitle }}
          </div>
          <div class="caption">{{ fmtAdjustPatchDate }}</div>
        </v-col>
      </v-row>
      <v-overlay
        class="achievement_overlay"
        v-if="isSelected && !simplicity"
        color="success"
        :opacity="0.15"
        absolute
      >
        <v-row no-gutters>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-icon class="ma-3 overlay_icon" color="success" large
              >fas fa-check</v-icon
            >
          </v-col>
        </v-row>
      </v-overlay>
      <v-overlay
        class="achievement_overlay"
        v-if="hover && achievement.isCompleted && !simplicity && !isSelected"
        absolute
        :opacity="0.1"
        color="#fff"
      />
    </v-card>
  </v-hover>
</template>

<script lang="ts">
  import Vue, { PropType } from 'vue'
  import {
    CompletedAchievement,
    AchievementKind,
    FetchedItemData,
    Patch,
  } from '@murofush/forfan-common-package/lib/types'
  import {
    ImgMixin,
    TagMixin,
    PatchMixin,
    DateMixin,
  } from '@murofush/forfan-common-vue'

  import {
    TagStore,
    PatchStore,
    AchievementStore,
    SelectedCharaInfoStore,
  } from '~/store'
  import itemViewer from '~/components/achievementSelect/itemViewer.vue'
  import { isLocalError } from '@murofush/forfan-common-package/lib/function'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import { accentColor } from '~/common/const'

  export default Vue.extend({
    mixins: [ImgMixin, TagMixin, PatchMixin, DateMixin],
    components: { itemViewer },
    props: {
      achievement: {
        type: Object as PropType<CompletedAchievement>,
        required: true,
      },
      kindIndex: {
        type: Number,
        required: true,
      },
      categoryIndex: {
        type: Number,
        required: true,
      },
      groupIndex: {
        type: Number,
        required: true,
      },
      achievementIndex: {
        type: Number,
        required: true,
      },
      simplicity: {
        type: Boolean,
        default: false,
      },
      tile: {
        type: Boolean,
        default: false,
      },
      maxWidth: {
        type: Number,
        default: undefined,
      },
      width: {
        type: Number,
        default: undefined,
      },
      height: {
        type: Number,
        default: undefined,
      },
      isSelected: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      achievementIndexPath(): AchievementIndexPath {
        return {
          kindIndex: this.kindIndex,
          categoryIndex: this.categoryIndex,
          groupIndex: this.groupIndex,
          achievementIndex: this.achievementIndex,
        } as AchievementIndexPath
      },
      achievementCardColor() {
        if (this.achievement.isCompleted) {
          return 'card'
        }
        return undefined
      },
      itemAwardObject(): FetchedItemData | null {
        if (this.achievement.itemAward) {
          return {
            itemAward: this.achievement.itemAward!!,
            itemAwardUrl: this.achievement.itemAwardUrl!!,
            itemAwardImageUrl: this.achievement.itemAwardImageUrl!!,
            itemAwardImagePath: this.achievement.itemAwardImagePath!!,
          }
        }
        return null
      },
      isUnlockBeforeAdjust(): boolean {
        const adjustmentData = this.getPatchById(
          this.achievement.adjustmentPatchId
        )
        if (
          adjustmentData &&
          adjustmentData.date &&
          this.achievement.completedDate
        ) {
          return (
            new Date(this.achievement.completedDate) <
            new Date(adjustmentData.date)
          )
        }
        return false
      },
      unlockBeforeAdjustStyle(): Object {
        const fontColor = this.isUnlockBeforeAdjust ? accentColor : 'inherit'
        return { color: fontColor }
      },
      fmtComplitedDate(): string {
        if (this.achievement.completedDate && this.achievement.isCompleted) {
          return (this as any).formatDate(
            new Date(this.achievement.completedDate)
          )
        }
        return ''
      },
      fmtAdjustPatchDate(): string {
        if (this.adjustmentPatch && this.adjustmentPatch.date) {
          return (this as any).formatDate(new Date(this.adjustmentPatch.date))
        }
        return ''
      },
      adjustmentPatch(): Patch | null {
        return this.getPatchById(this.achievement.adjustmentPatchId)
      },
      achievementKinds(): AchievementKind<CompletedAchievement>[] {
        return AchievementStore.getAchievementKinds
      },
      hierarchy(): string {
        if (!(this.achievementKinds && this.achievementKinds[this.kindIndex]))
          return '???'
        return `${this.achievementKinds[this.kindIndex].kind.name ?? '???'} > ${
          this.achievementKinds[this.kindIndex].achievementCategories[
            this.categoryIndex
          ]?.category.name ?? '???'
        }`
      },
      cardTextWidth(): string | undefined {
        if (!this.width) {
          return undefined
        }
        // .v-card__title のpadding分引く
        return `${this.width}px`
      },
    },
    methods: {
      getTagById(id: number) {
        return (this as any).getTagByIdProcess(TagStore.getTags, id)
      },
      getPatchById(id: number): Patch | null {
        return (this as any).getPatchByIdProcess(PatchStore.getPatches, id)
      },
      getCardElevation(hover: boolean): number {
        if (!this.achievement.isCompleted) return 0
        return hover ? 12 : 4
      },
      clickAchievement() {
        if (this.simplicity) return
        if (this.isSelected) {
          this.removeSelectedAchievement()
        } else {
          this.selectAchievement()
        }
      },
      async removeSelectedAchievement() {
        const error =
          await SelectedCharaInfoStore.deleteSelectedAchievementIndexByValues(
            this.achievementIndexPath
          )
        if (isLocalError(error)) {
          this.$emit(OUTPUT_SNACKBAR, {
            text: error.value,
            color: 'error',
          } as emitOutputSnackbar)
        }
      },
      async selectAchievement() {
        const error = await SelectedCharaInfoStore.setSelectedAchievementIndex(
          this.achievementIndexPath
        )
        if (isLocalError(error)) {
          this.$emit(OUTPUT_SNACKBAR, {
            text: error.value,
            color: 'error',
          } as emitOutputSnackbar)
        }
      },
    },
  })
</script>

<style lang="scss" scoped>
  .achievement_overlay {
    z-index: 11 !important;
  }
  .overlay_icon {
    opacity: 0.8;
  }
  .achievement-card {
    overflow-y: hidden;
  }
  .title_container {
    overflow-y: hidden;
  }
  .simplicity_title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
</style>
