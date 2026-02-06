<template>
  <v-card id="selected_achievement_container" tile>
    <v-expansion-panels v-model="panelFlag" focusable tile>
      <v-expansion-panel>
        <v-expansion-panel-header>
          選択済みアチーブメント一覧 ：
          {{ selectedAchievements.length }} / {{ maxAchievementCount }}
        </v-expansion-panel-header>
        <v-expansion-panel-content class="expansion_panel_content">
          <v-row no-gutters align="center" :style="{ height: '100%' }">
            <v-col :style="viewerButtonStyle" cols="auto">
              <v-icon-btn
                small
                v-show="$vuetify.breakpoint.smAndUp"
                @click="$emit('back')"
                color="secondary"
                text="キャラクター選択"
                icon="fas fa-user-plus"
              ></v-icon-btn>
              <v-btn
                fab
                dark
                v-show="$vuetify.breakpoint.xsOnly"
                @click="$emit('back')"
                color="secondary"
              >
                <v-icon>fas fa-user-plus</v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-row
                class="scrollable_container"
                v-if="selectedAchievements.length > 0"
                no-gutters
                justify="center"
              >
                <v-col
                  cols="auto"
                  class="achievement_item ma-2"
                  v-for="(
                    achievement, achievementIndex
                  ) in selectedAchievements"
                  :key="achievementIndex"
                >
                  <v-menu
                    fixed
                    absolute
                    offset-y
                    top
                    class="selected_achievement_menu"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <div v-bind="attrs" v-on="on">
                        <achievement-card
                          class="simplicity_achievement_card"
                          simplicity
                          tile
                          :achievement="achievement.data"
                          :kindIndex="achievement.indexes.kindIndex"
                          :categoryIndex="achievement.indexes.categoryIndex"
                          :groupIndex="achievement.indexes.groupIndex"
                          :achievementIndex="
                            achievement.indexes.achievementIndex
                          "
                          :maxWidth="300"
                          :height="100"
                          @output_snackbar="showSnackbar"
                        ></achievement-card>
                      </div>
                    </template>
                    <v-card>
                      <v-card-title class="menu_title">
                        {{ achievement.data.title }}
                      </v-card-title>
                      <v-row no-gutters>
                        <v-col cols="12">
                          <v-divider></v-divider>
                        </v-col>
                        <v-col cols="12">
                          <v-divider></v-divider>
                          <v-list dense>
                            <!-- TODO -->
                            <!-- <v-list-item
                      @click="showSelectedAchievement(achievementIndex)"
                    >
                      <v-list-item-content>
                        <v-list-item-title>一覧で表示</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item> -->
                            <v-list-item
                              @click="
                                deleteSelectedAchievement(achievementIndex)
                              "
                            >
                              <v-list-item-content>
                                <v-list-item-title>削除</v-list-item-title>
                              </v-list-item-content>
                            </v-list-item>
                          </v-list>
                        </v-col>
                      </v-row>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>
              <v-row
                v-else
                class="achievement_item user_select_disable"
                align="center"
                justify="center"
              >
                <v-col class="text-center">
                  アチーブメントが選択されていません
                </v-col>
              </v-row>
            </v-col>
            <v-col :style="viewerButtonStyle" cols="auto">
              <v-icon-btn
                small
                v-show="$vuetify.breakpoint.smAndUp"
                @click="$emit('next')"
                :color="isMaxSizeSelected ? 'primary' : 'secondary'"
                icon="far fa-id-card"
                text="名刺デザイン編集"
              >
              </v-icon-btn>
              <v-btn
                fab
                v-show="$vuetify.breakpoint.xsOnly"
                @click="$emit('next')"
                :color="isMaxSizeSelected ? 'primary' : 'secondary'"
              >
                <v-icon>far fa-id-card</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>
<script lang="ts">
  import { maxAchievementCount } from '~/common/const'
  import Vue from 'vue'
  import {
    AchievementSelectorStateStore,
    SelectedCharaInfoStore,
  } from '~/store'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import VIconBtn from '~/components/atoms/VIconBtn.vue'

  export default Vue.extend({
    components: {
      VIconBtn,
    },
    data() {
      return {}
    },
    watch: {
      selectedAchievements: {
        handler(
          after: AchievementDataWithIndex[],
          before: AchievementDataWithIndex[]
        ) {
          console.log(after)
          console.log(before)
          if (before.length > 0 && after.length <= 0) {
            AchievementSelectorStateStore.setIsPanelOpened(false)
          }
          if (before.length <= 0 && after.length >= 0) {
            AchievementSelectorStateStore.setIsPanelOpened(true)
          }
        },
        deep: true,
      },
    },
    computed: {
      panelFlag: {
        get(): number | undefined {
          return AchievementSelectorStateStore.getIsPanelOpened ? 0 : undefined
        },
        set(val: number | undefined) {
          AchievementSelectorStateStore.setIsPanelOpened(val != null)
        },
      },
      maxAchievementCount(): number {
        return maxAchievementCount
      },
      selectedAchievements(): AchievementDataWithIndex[] {
        return SelectedCharaInfoStore.getAchievements
      },
      isMaxSizeSelected(): boolean {
        return this.selectedAchievements.length >= maxAchievementCount
      },
      viewerButtonStyle(): Object {
        return { height: this.$vuetify.breakpoint.smAndUp ? '100%' : 'auto' }
      },
    },
    methods: {
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$emit(OUTPUT_SNACKBAR, snackbar)
      },
      showSelectedAchievement(index: number) {
        // まだ使ってない
        // TODO: きれいにして実装
        AchievementSelectorStateStore.setAchievementIndexPath(
          SelectedCharaInfoStore.getAchievementIndexes[index]
        )
      },
      deleteSelectedAchievement(index: number) {
        SelectedCharaInfoStore.deleteSelectedAchievementIndexByIndex(index)
      },
    },
  })
</script>
<style lang="scss" scoped>
  #selected_achievement_container {
    width: 100%;
    position: fixed;
    z-index: 101 !important;
    bottom: 0px;
  }
  .expansion_panel_content {
    padding-top: 16px;
    height: 150px;
  }
  .achievement_item {
    height: 100px;
  }
  .selected_achievement_menu {
    z-index: 101;
  }
  .scrollable_container {
    overflow-y: auto;
    height: 124px;
  }
  .non_selected_text {
    color: #aaaaaa !important;
  }
  .menu_title {
    font-size: 0.85rem;
    font-weight: bold;
    opacity: 0.8;
  }
</style>
