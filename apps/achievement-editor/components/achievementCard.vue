<template>
  <v-card outlined>
    <v-card-title>
      <achievement-icon
        :icon-path="achievement.iconPath"
        :icon-url="achievement.iconUrl"
        :image-size="40"
        class="mr-1"
      ></achievement-icon>
      {{ achievement.title }}
      <v-btn
        v-if="achievement.isCreated"
        class="ml-2"
        icon
        @click="achievementEdit(listIndex, categorizedIndex)"
        ><v-icon>fas fa-edit</v-icon></v-btn
      >
    </v-card-title>
    <v-card-text>
      {{ achievement.description }}
    </v-card-text>
    <label v-if="achievement.isEdited" class="caption">Edited</label>
    <label v-if="achievement.isCreated" class="caption">Created</label>
    <v-divider
      v-if="achievement.titleAward || achievement.itemAward"
      class="mx-4"
    ></v-divider>
    <div v-if="achievement.titleAward">
      <span class="caption">称号:</span> {{ achievement.titleAward }}
    </div>
    <div v-if="achievement.titleAwardMan || achievement.titleAwardWoman">
      <span class="caption">称号:</span><br />
      男性: {{ achievement.titleAwardMan }} <br />
      女性: {{ achievement.titleAwardWoman }}
    </div>
    <div v-if="itemAwardObject">
      <span class="caption">アイテム:</span>
      <itemViewer
        v-model="itemAwardObject"
        :load-local-img="achievement.isNowCreated"
      ></itemViewer>
    </div>
    <v-divider class="my-2"></v-divider>

    <span class="caption">タグ：</span>
    <v-chip
      v-for="tagId in achievement.tagIds"
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
    <v-btn icon class="ml-1" @click.stop="$emit('tag_edit')">
      <v-icon>fas fa-tags</v-icon>
    </v-btn>

    <v-divider class="my-2"></v-divider>
    <v-row no-gutters>
      <v-col cols="6">
        <div>
          <span class="caption">対応パッチ：</span>
          <v-chip v-if="getPatchById(achievement.patchId)">
            {{ getPatchById(achievement.patchId).number }}
            -
            {{ getPatchById(achievement.patchId).subtitle }}</v-chip
          >
        </div>
        <v-btn icon class="ml-1" @click.stop="$emit('patch_edit')">
          <v-icon>fas fa-calendar-day</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="6">
        <div>
          <span class="caption">緩和パッチ：</span>
          <v-chip v-if="getPatchById(achievement.adjustmentPatchId)">
            {{ getPatchById(achievement.adjustmentPatchId).number }}
            -
            {{ getPatchById(achievement.adjustmentPatchId).subtitle }}</v-chip
          >
        </div>
        <v-btn icon class="ml-1" @click.stop="$emit('adjustment_patch_edit')">
          <v-icon>fas fa-calendar-day</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import {
  EditAchievement,
  FetchedItemData,
} from '@murofush/forfan-common-package/lib/types'
import { ImgMixin, TagMixin, PatchMixin } from '@murofush/forfan-common-vue'
import itemViewer from '~/components/itemViewer.vue'

import { TagStore, PatchStore } from '~/store'

export default Vue.extend({
  components: {
    itemViewer,
  },
  mixins: [ImgMixin, TagMixin, PatchMixin],
  props: {
    achievement: {
      type: Object as PropType<EditAchievement>,
      default: null,
    },
  },
  computed: {
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
  },
  methods: {
    getTagById(id: number) {
      return (this as any).getTagByIdProcess(TagStore.getTags, id)
    },
    getPatchById(id: number) {
      return (this as any).getPatchByIdProcess(PatchStore.getPatches, id)
    },
  },
})
</script>

<style></style>
