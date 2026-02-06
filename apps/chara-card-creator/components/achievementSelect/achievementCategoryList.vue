<template>
  <v-card flat id="anchor" v-resize="onResize">
    <client-only>
      <v-card-text class="pa-0">
        <v-row no-gutters>
          <v-col cols="4" sm="3" md="2">
            <v-navigation-drawer
              :mobile-breakpoint="0"
              :height="`${navigationDrawerHeight}px`"
              width="100%"
              :style="stickyPosition"
            >
              <v-subheader :style="navigationDrawerHeaderStyle">
                {{ KindValues[selectedKindIndex].name }}
              </v-subheader>
              <v-divider></v-divider>
              <v-list
                dense
                nav
                :style="navigationDrawerContainerStyle"
                class="overflow-y-scroll"
              >
                <v-list-item-group v-model="selectedCategoryIndex" mandatory>
                  <v-list-item
                    v-for="(category, categoryIndex) in KindValues[
                      selectedKindIndex
                    ].categories"
                    :key="categoryIndex"
                    link
                  >
                    <v-list-item-content>
                      <v-list-item-title>{{ category.name }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-navigation-drawer>
          </v-col>
          <v-col v-if="isSynced && group">
            <v-card flat>
              <v-row no-gutters class="pa-3">
                <v-col
                  :id="`${getGroupElementId(groupIndex)}`"
                  cols="12"
                  v-for="(groupItem, groupIndex) in group"
                  :key="groupIndex"
                >
                  <achievement-list
                    v-if="defer(groupIndex)"
                    :value="groupItem"
                    :groupIndex="groupIndex"
                    @output_snackbar="showSnackbar"
                  ></achievement-list>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
          <v-col v-else-if="isSynced">
            <v-row justify="center" class="text-center mt-2">
              <v-col cols="12">データの取得に失敗しました。</v-col>
              <v-col
                cols="12"
                v-if="
                  achievementKind.achievementCategories[
                    this.selectedCategoryIndex
                  ] &&
                  achievementKind.achievementCategories[
                    this.selectedCategoryIndex
                  ].errorMessage
                "
              >
                errorMessage:
                {{
                  achievementKind.achievementCategories[
                    this.selectedCategoryIndex
                  ].errorMessage
                }}
              </v-col>
              <v-col cols="12" v-else>不明なエラーが発生しました。</v-col>
              <v-col cols="12">
                <v-btn color="secondary" class="font-weight-bold" large>
                  <v-icon class="mr-2" @click="reload()">
                    fas fa-sync-alt
                  </v-icon>
                  再取得
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
          <v-col v-else>
            <v-row justify="center">
              <v-col cols="auto" class="mt-2">
                <v-progress-circular
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </v-col>
            </v-row>
          </v-col>
          <v-col v-show="$vuetify.breakpoint.mdAndUp" md="2">
            <v-navigation-drawer
              right
              width="100%"
              :mobile-breakpoint="0"
              :style="stickyPosition"
              :height="`${navigationDrawerHeight}px`"
            >
              <v-subheader :style="navigationDrawerHeaderStyle"
                >グループ</v-subheader
              >
              <v-divider></v-divider>
              <category-list-item
                :containerStyle="groupNavigationDrawerContainerStyle"
              ></category-list-item>
              <v-divider v-show="!isPanelOpened"></v-divider>
            </v-navigation-drawer>
          </v-col>
          <v-navigation-drawer
            v-show="$vuetify.breakpoint.smAndDown"
            v-model="mobileNavigationOpened"
            :mobile-breakpoint="0"
            right
            app
            temporary
            width="300px"
            class="mobile_navigation_drawer"
          >
            <v-subheader :style="navigationDrawerHeaderStyle"
              >グループ</v-subheader
            >
            <v-divider></v-divider>
            <category-list-item
              @click="mobileNavigationOpened = false"
              :containerStyle="groupNavigationDrawerAppContainerStyle"
            >
            </category-list-item>
          </v-navigation-drawer>
        </v-row>
      </v-card-text>
    </client-only>
  </v-card>
</template>
<script lang="ts">
  import Vue from 'vue'
  import { DeferMixin } from '@murofush/forfan-common-vue'
  import {
    AchievementKind,
    CompletedAchievement,
  } from '@murofush/forfan-common-package/lib/types'
  import { AchievementStore, AchievementSelectorStateStore } from '~/store'
  import {
    tabsHeight,
    openSelectedAchievementPanelHeight,
    closeSelectedAchievementPanelHeight,
    fabButtonSize,
    fabMarginY,
    navigationDrawerHeaderHeight,
  } from '~/common/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import categoryListItem from '~/components/achievementSelect/categoryListItems.vue'
  import achievementMixin from '~/mixins/achievement'

  export default Vue.extend({
    components: { categoryListItem },
    mixins: [DeferMixin, achievementMixin],
    props: {},
    data() {
      return {
        windowSize: {
          x: 0,
          y: 0,
        } as Position,
        mobileNavigationOpened: false,
      }
    },
    mounted() {
      this.onResize()
      this.fetchAchievementCategory()
      this.deferUpdateData()
    },
    watch: {
      selectedKindIndex() {
        this.selectedCategoryIndex = 0
        this.updateDataProcess()
      },
      async selectedCategoryIndex() {
        this.updateDataProcess()
      },
      isSynced() {
        if ((this as any).isSynced) {
          this.deferUpdateData()
        }
      },
      // groupIndex() {
      //   this.$nextTick(() => {
      //     VueScrollTo.scrollTo(
      //       `#${this.getGroupElementId(this.groupIndex)}`
      //     )
      //     // 現在、表示中のgroupIndexを更新してないので、スクロール更新した段階でgroupIndexをリセットする。
      //     AchievementSelectorStateStore.setGroupIndex(0)
      //     // 現在、参照してないけどここもリセット
      //     AchievementSelectorStateStore.setDataIndex(0)
      //   })
      // },
    },
    computed: {
      isPanelOpened(): boolean {
        return AchievementSelectorStateStore.getIsPanelOpened
      },
      isShowRightNavigationDrawer(): boolean {
        return this.$vuetify.breakpoint.mdAndUp
      },
      selectedCategoryIndex: {
        get(): number {
          return AchievementSelectorStateStore.getAchievementIndex.categoryIndex
        },
        set(val: number) {
          AchievementSelectorStateStore.setCategoryIndex(val)
        },
      },
      groupIndex() {
        return AchievementSelectorStateStore.getAchievementIndex.groupIndex
      },
      completedAchievements(): AchievementKind<CompletedAchievement>[] {
        return AchievementStore.getAchievementKinds
      },
      selectedAchievementPanelHeight(): number {
        return AchievementSelectorStateStore.getIsPanelOpened
          ? openSelectedAchievementPanelHeight
          : closeSelectedAchievementPanelHeight
      },
      navigationDrawerHeight(): number {
        return (
          this.windowSize.y -
          ((this as any).topHeightSpace + this.selectedAchievementPanelHeight)
        )
      },
      // navigation drawerのコンテナより上側と下側のstkcyな部分+Headerのsizeを引く
      navigationDrawerListHeight(): number {
        return (
          this.windowSize.y -
          ((this as any).topHeightSpace +
            navigationDrawerHeaderHeight +
            this.selectedAchievementPanelHeight)
        )
      },
      navigationDrawerContainerStyle(): Object {
        return {
          height: `${this.navigationDrawerListHeight}px`,
        }
      },
      groupNavigationDrawerListHeight(): number {
        const fabButtonMargin = AchievementSelectorStateStore.getIsPanelOpened
          ? 0
          : fabButtonSize + fabMarginY * 2
        return this.navigationDrawerListHeight - fabButtonMargin
      },
      groupNavigationDrawerContainerStyle(): Object {
        return {
          height: `${this.groupNavigationDrawerListHeight}px`,
        }
      },
      groupNavigationDrawerAppContainerStyle(): Object {
        return {
          height: `${this.windowSize.y - navigationDrawerHeaderHeight}px`,
        }
      },
      tabsHeight(): number {
        return tabsHeight
      },
      stickyPosition(): Object {
        return {
          position: ['sticky', '-webkit-sticky'],
          top: `${(this as any).topHeightSpace}px`,
          'z-index': 2,
        }
      },
    },
    methods: {
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$emit(OUTPUT_SNACKBAR, snackbar)
      },
      deferUpdateData() {
        if ((this as any).isSynced) {
          ;(this as any).itemLength = (this as any).group.length
          ;(this as any).displayPriority = 0
          ;(this as any).runDisplayPriority()
        }
      },
      onResize() {
        this.windowSize = { x: window.innerWidth, y: window.innerHeight }
      },
      async reload() {
        await this.updateDataProcess()
      },
      setNavigationOpened(val: boolean) {
        this.mobileNavigationOpened = val
      },
      async fetchAchievementCategory() {
        const categoryId = (this as any).KindValues[
          (this as any).selectedKindIndex
        ].categories[this.selectedCategoryIndex]?.id
        if (categoryId == null) {
          console.error(
            'categoryIdが見つかりませんでした。',
            (this as any).KindValues[(this as any).selectedKindIndex]
          )
          return
        }
        await (this as any).fetchAcievementCategoryById(categoryId)
      },
      async updateDataProcess() {
        if (!(this as any).isSynced) {
          await this.fetchAchievementCategory()
        }
        this.deferUpdateData()
      },
    },
  })
</script>
<style lang="scss" scoped>
  .overflow-y-scroll {
    overflow-y: auto;
  }
  .clickable {
    cursor: pointer;
    user-select: none;
  }
  .mobile_navigation_drawer {
    z-index: 102;
  }
</style>
