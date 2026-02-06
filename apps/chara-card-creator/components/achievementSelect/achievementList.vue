<template>
  <v-row no-gutters class="achievement-list my-4">
    <v-col cols="auto" class="list_title_container">
      <h3 :style="listTitleStyle" class="list_title mb-3 pl-2">
        {{ value.title }}
      </h3>
    </v-col>
    <v-col cols="12">
      <v-row>
        <v-col
          v-for="(data, achievementIndex) in value.data"
          :key="achievementIndex"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <achievement-card
            v-if="defer(achievementIndex)"
            :achievement="data"
            :kindIndex="kindIndex"
            :categoryIndex="categoryIndex"
            :groupIndex="groupIndex"
            :achievementIndex="achievementIndex"
            :isSelected="isSelected(achievementIndex)"
            @output_snackbar="showSnackbar"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script lang="ts">
  import {
    Group,
    CompletedAchievement,
  } from '@murofush/forfan-common-package/lib/types'
  import { DeferMixin } from '@murofush/forfan-common-vue'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import Vue, { PropType } from 'vue'
  import {
    AchievementSelectorStateStore,
    SelectedCharaInfoStore,
  } from '~/store'

  export default Vue.extend({
    data() {
      return {}
    },
    mixins: [DeferMixin],
    mounted() {
      ;(this as any).itemLength = this.value.data.length
      ;(this as any).displayPriority = 0
      ;(this as any).runDisplayPriority()
    },
    props: {
      value: {
        type: Object as PropType<Group<CompletedAchievement>>,
        required: true,
      },
      groupIndex: {
        type: Number,
        required: true,
      },
    },
    computed: {
      kindIndex() {
        return AchievementSelectorStateStore.getAchievementIndex.kindIndex
      },
      categoryIndex() {
        return AchievementSelectorStateStore.getAchievementIndex.categoryIndex
      },
      listTitleStyle() {
        return {
          color: `${this.$vuetify.theme.currentTheme.primary}`,
          'border-bottom': `solid 1px ${this.$vuetify.theme.currentTheme.primary}`,
        }
      },
    },
    watch: {
      value() {
        ;(this as any).itemLength = this.value.data.length
        ;(this as any).displayPriority = 0
        ;(this as any).runDisplayPriority()
      },
    },
    methods: {
      isSelected(achievementIndex: number): boolean {
        for (const existIndex of SelectedCharaInfoStore.getAchievementIndexes) {
          if (
            existIndex.kindIndex === this.kindIndex &&
            existIndex.categoryIndex === this.categoryIndex &&
            existIndex.groupIndex === this.groupIndex &&
            existIndex.achievementIndex === achievementIndex
          ) {
            return true
          }
        }
        return false
      },
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$emit(OUTPUT_SNACKBAR, snackbar)
      },
    },
  })
</script>
<style lang="scss" scoped>
  .list_title_container {
    width: 100%;
  }
  .list_title {
    font-size: 32px;
    line-height: 1.2em;
  }
</style>
