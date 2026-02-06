<template>
  <v-row no-gutters class="achievement_selector">
    <v-col cols="12">
      <v-tabs
        class="tabs"
        ref="tabs"
        show-arrows
        v-model="selectedAchievementCategoryIndex"
        :style="tabsStyle"
        :height="tabsHeight"
      >
        <v-tab
          v-for="achievementCategory in achievementsCategoryValues"
          :key="achievementCategory.key"
        >
          {{ achievementCategory.name }}
        </v-tab>
      </v-tabs>
      <achievement-category-list
        ref="achievementCategoryList"
        @output_snackbar="showSnackbar"
      ></achievement-category-list>
    </v-col>
  </v-row>
</template>
<script lang="ts">
  import Vue from 'vue'
  import {
    AchievementKind,
    CompletedAchievement,
    Tag,
    FlattenTag,
    Kind,
  } from '@murofush/forfan-common-package/lib/types'
  import { AchievementStore, AchievementSelectorStateStore } from '~/store'
  import { TagStore } from '~/store'
  import { KIND } from '@murofush/forfan-common-package/lib/const'
  import { tabsHeight, headerHeight, borderHeight } from '~/common/const'
  import achievementCategoryList from '~/components/achievementSelect/achievementCategoryList.vue'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'

  interface StringKeyObject {
    // 今回はstring
    [key: string]: any
  }

  export default Vue.extend({
    components: { achievementCategoryList },
    data: () => {
      return {
        // これがないと初回表示時にVTabにsliderが表示されない
        // https://github.com/vuetifyjs/vuetify/issues/11558#issuecomment-688945105
        intersectionObserver: null as IntersectionObserver | null,
      }
    },
    computed: {
      selectedAchievementCategoryIndex: {
        get(): number {
          return AchievementSelectorStateStore.getAchievementIndex.kindIndex
        },
        set(val: number) {
          AchievementSelectorStateStore.setAchievementCategoryIndex(val)
        },
      },
      completedAchievements(): AchievementKind<CompletedAchievement>[] {
        return AchievementStore.getAchievementKinds
      },
      achievementsCategoryKeys(): (keyof typeof KIND)[] {
        return Object.keys(KIND) as (keyof typeof KIND)[]
      },
      achievementsCategoryValues(): Kind[] {
        return Object.values(KIND)
      },
      tabsHeight() {
        return `${tabsHeight}px`
      },
      tabsStyle() {
        const config: { [key: string]: any } = {
          position: ['sticky', '-webkit-sticky'],
          top: `${headerHeight}px`,
          'z-index': 12,
        }
        config.borderBottom = this.$vuetify.theme.dark
          ? `solid ${borderHeight}px rgba(255,255,255,0.12)`
          : `solid ${borderHeight}px rgba(0,0,0,0.12)`
        return config
      },
    },
    async mounted() {
      this.observeVisibility()
    },
    beforeDestroy() {
      this.unObserveVisibility()
    },
    methods: {
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$emit(OUTPUT_SNACKBAR, snackbar)
      },
      observeVisibility() {
        // これがないと初回表示時にVTabにsliderが表示されない
        // https://github.com/vuetifyjs/vuetify/issues/11558#issuecomment-688945105
        const element = (this.$refs.tabs as Vue).$el
        if (window.IntersectionObserver) {
          this.intersectionObserver = new IntersectionObserver(
            (entries) => {
              if (entries[0].intersectionRatio) {
                // There is an intersection, the content is visible
                // Manually calling VTabs onResize method to properly show the slider
                ;(this.$refs.tabs as any).onResize()
              }
            },
            {
              root: document.body,
            }
          )
          this.intersectionObserver.observe(element)
        }
      },
      unObserveVisibility() {
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect()
        }
      },
      sortTag(tags: FlattenTag[]) {
        tags.sort((a, b) => {
          const aIndex = a.id ? a.id : -1
          const bIndex = b.id ? b.id : -1
          return aIndex - bIndex
        })
      },
      getGroupTagIds(
        kindIndex: number,
        tagCategoryIndex: number,
        tagGroupIndex: number
      ): number[] {
        const categorizedData =
          this.completedAchievements[kindIndex].achievementCategories[
            tagCategoryIndex
          ].group[tagGroupIndex].data
        if (categorizedData.length > 0) {
          let allMatchedTagIds = categorizedData[0].tagIds
          for (let i = 1; i < categorizedData.length; i++) {
            const matchedTag: number[] = []
            allMatchedTagIds.forEach((baseTagVal) => {
              categorizedData[i].tagIds.forEach((checkTagVal) => {
                if (baseTagVal === checkTagVal) {
                  matchedTag.push(checkTagVal)
                }
              })
            })
            allMatchedTagIds = matchedTag
          }
          return allMatchedTagIds
        }
        return []
      },
      flattenTags(tags: Tag[]): FlattenTag[] {
        let outputedArray: FlattenTag[] = []
        const subFlattenTag = (obj: StringKeyObject): StringKeyObject => {
          const flattenObj: StringKeyObject = {}
          if (obj) {
            Object.keys(obj).forEach((key) => {
              if (
                typeof obj[key] === 'object' &&
                Array.isArray(obj[key]) &&
                obj[key] !== null
              ) {
                subFlattenTags(obj[key] as Tag[])
              } else {
                flattenObj[key] = obj[key]
              }
            })
          }
          return flattenObj
        }
        const subFlattenTags = (tags: Tag[]) => {
          const flattenTags: FlattenTag[] = []
          if (tags) {
            tags.forEach((obj: StringKeyObject) => {
              const flattenObj = subFlattenTag(obj)
              flattenTags.push(flattenObj as FlattenTag)
            })
            outputedArray = outputedArray.concat(flattenTags)
          }
        }
        subFlattenTags(tags)
        this.sortTag(outputedArray)
        return outputedArray
      },
      getTagById(id: number) {
        const tag = this.flattenTags(TagStore.getTags).find((tag) => {
          return tag.id === id
        })
        if (tag) {
          return tag
        }
        return null
      },
      isAchievementKindFetched(achievementKindIndex: number): boolean {
        if (!this.completedAchievements[achievementKindIndex]) {
          console.error(
            `INTERNAL_ERROR: this.completedAchievements[${achievementKindIndex}]が見つかりませんでした。`
          )
          return false
        }
        return (
          this.completedAchievements[achievementKindIndex].achievementCategories
            .length >=
          this.completedAchievements[achievementKindIndex].kind.categories
            .length
        )
      },
      setNavigationOpened(val: boolean) {
        ;(this.$refs.achievementCategoryList as any)?.setNavigationOpened(val)
      },
    },
  })
</script>
<style lang="scss" scoped></style>
