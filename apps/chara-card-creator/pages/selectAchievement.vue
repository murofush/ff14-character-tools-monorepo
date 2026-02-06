<template>
  <div>
    <edit-achievement-selector
      ref="editAchievementSelector"
      @output_snackbar="showSnackbar"
    />
    <v-fab-transition>
      <v-btn
        v-show="!isPanelOpened"
        fab
        large
        dark
        :width="fabButtonSize"
        :height="fabButtonSize"
        :style="fabNextBtnStyle"
        @click="nextPage"
        :color="isMaxSizeSelected ? 'primary' : 'secondary'"
      >
        <v-icon>far fa-id-card</v-icon>
      </v-btn>
    </v-fab-transition>

    <v-fab-transition>
      <v-btn
        v-show="$vuetify.breakpoint.smAndDown"
        fab
        large
        dark
        :width="fabButtonSize"
        :height="fabButtonSize"
        :style="fabDrawerOpenedStyle"
        @click="openNavigation"
        :color="isMaxSizeSelected ? 'primary' : 'secondary'"
      >
        <v-icon>fas fa-list</v-icon>
      </v-btn>
    </v-fab-transition>
    <selected-achievement-viewer
      @back="backPage"
      @next="nextPage"
    ></selected-achievement-viewer>
  </div>
</template>
<script lang="ts">
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import editAchievementSelector from '~/components/achievementSelect/editAchievementSelector.vue'
  import SelectedAchievementViewer from '~/components/achievementSelect/selectedAchievementViewer.vue'
  import checkFetchedMiddleware from '~/mixins/checkFetchedMiddleware'
  import {
    AchievementSelectorStateStore,
    SelectedCharaInfoStore,
  } from '~/store'

  import Vue from 'vue'
  import {
    closeSelectedAchievementPanelHeight,
    fabButtonSize,
    fabMarginY,
    maxAchievementCount,
    openSelectedAchievementPanelHeight,
  } from '~/common/const'
  const fabBtnMarginX = 18
  export default Vue.extend({
    mixins: [checkFetchedMiddleware],
    components: {
      SelectedAchievementViewer,
      editAchievementSelector,
    },
    mounted() {
      AchievementSelectorStateStore.setIsPanelShowing(true)
    },
    beforeDestroy() {
      AchievementSelectorStateStore.setIsPanelShowing(false)
    },
    computed: {
      selectedAchievementPanelHeight(): number {
        return AchievementSelectorStateStore.getIsPanelOpened
          ? openSelectedAchievementPanelHeight
          : closeSelectedAchievementPanelHeight
      },
      fabButtonSize(): number {
        return fabButtonSize
      },
      fabDrawerOpenedStyle(): Object {
        const marginBottom = this.selectedAchievementPanelHeight + fabMarginY
        const marginRight = !this.isPanelOpened
          ? fabButtonSize + fabBtnMarginX * 3
          : fabBtnMarginX * 2
        return {
          position: 'fixed',
          bottom: `${marginBottom}px`,
          right: `${marginRight}px`,
          zIndex: 101,
        }
      },
      fabNextBtnStyle(): Object {
        const marginBottom = this.selectedAchievementPanelHeight + fabMarginY
        const marginRight = fabBtnMarginX * 2
        return {
          position: 'fixed',
          bottom: `${marginBottom}px`,
          right: `${marginRight}px`,
          zIndex: 101,
        }
      },
      isMaxSizeSelected(): boolean {
        return (
          SelectedCharaInfoStore.getAchievements.length >= maxAchievementCount
        )
      },
      isPanelOpened(): boolean {
        return AchievementSelectorStateStore.getIsPanelOpened
      },
    },
    methods: {
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$nuxt.$emit(OUTPUT_SNACKBAR, snackbar)
      },
      nextPage() {
        this.$router.push('/editCharaCard')
      },
      backPage() {
        this.$router.push('/')
      },
      openNavigation() {
        ;(this.$refs.editAchievementSelector as any)?.setNavigationOpened(true)
      },
    },
  })
</script>
<style lang="scss" scoped></style>
