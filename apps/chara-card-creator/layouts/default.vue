<template>
  <v-app>
    <v-app-bar
      class="app_bar"
      :height="headerHeight"
      color="app_bar"
      fixed
      app
      dark
    >
      <nuxt-link class="app_bar_title" to="/">
        <v-app-bar-title>
          <img height="20" class="d-block" src="aboutme_logo.png" />
        </v-app-bar-title>
      </nuxt-link>
      <supportPatchLabel v-show="$vuetify.breakpoint.smAndUp" class="ml-2">
      </supportPatchLabel>
      <v-spacer></v-spacer>
      <client-only>
        <v-row dense justify="end" align="center">
          <v-col cols="auto" v-if="selectedCharacter">
            <v-row no-gutters>
              <v-col
                cols="auto"
                class="mr-4"
                v-show="$vuetify.breakpoint.smAndUp"
              >
                <about-character-menu></about-character-menu>
              </v-col>
              <v-col cols="auto">
                <v-divider vertical></v-divider>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="auto" v-if="$vuetify.breakpoint.lgAndUp">
            <header-link-btns :items="linkItems"></header-link-btns>
          </v-col>
          <v-col cols="auto" v-else>
            <v-menu offset-y :close-on-content-click="false">
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon dark v-bind="attrs" v-on="on">
                  <v-icon>fas fa-ellipsis-v</v-icon>
                </v-btn>
              </template>
              <v-card>
                <v-row no-gutters>
                  <v-col cols="12" v-show="$vuetify.breakpoint.xsOnly">
                    <v-row dense class="ma-2">
                      <v-col cols="auto" align-self="center">
                        <supportPatchLabel v-show="$vuetify.breakpoint.xsOnly">
                        </supportPatchLabel>
                      </v-col>
                      <v-spacer></v-spacer>
                      <v-col cols="auto">
                        <about-character-menu></about-character-menu>
                      </v-col>
                      <v-col cols="auto">
                        <theme-toggle-btn></theme-toggle-btn>
                      </v-col>
                    </v-row>
                    <v-divider></v-divider>
                  </v-col>
                  <v-col cols="12">
                    <v-list :class="{ 'pt-0': $vuetify.breakpoint.xsOnly }">
                      <v-list-item
                        v-for="(item, index) in linkItems"
                        :key="index"
                        dense
                        nuxt
                        :to="item.link"
                        :disabled="item.disabled ? item.disabled : false"
                      >
                        <v-list-item-icon>
                          <v-icon v-text="item.icon"></v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title
                            v-text="item.title"
                          ></v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </v-col>
          <v-col cols="auto" v-show="$vuetify.breakpoint.smAndUp">
            <theme-toggle-btn color-type="light"></theme-toggle-btn>
          </v-col>
        </v-row>
      </client-only>
    </v-app-bar>
    <v-main>
      <v-container fluid class="pa-0 window_height_100">
        <v-snackbar
          v-model="snackbar.visibled"
          bottom
          :color="snackbar.color"
          :timeout="snackbar.timeout"
        >
          {{ snackbar.text }}
          <template #action="{ attrs }">
            <v-btn
              color="white"
              text
              v-bind="attrs"
              @click="snackbar.visibled = false"
            >
              閉じる
            </v-btn>
          </template>
        </v-snackbar>
        <nuxt />
      </v-container>
    </v-main>
    <v-footer :style="footerStyle">
      <v-row no-gutters class="footer">
        <v-col cols="auto" align-self="center">
          <v-row no-gutters>
            <v-col cols="12" class="mt-1">
              <span class="copyright_text">
                (C) SQUARE ENIX CO., LTD. All Rights Reserved.
              </span>
            </v-col>
            <v-col cols="12" class="mt-1">
              <span class="copyright_text">(C) {{ siteName }}</span>
            </v-col>
          </v-row>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto" align-self="center">
          <h4 class="header_text mr-2">LINK:</h4>
        </v-col>
        <v-col cols="auto" class="mr-2" align-self="center">
          <v-row no-gutters>
            <v-col cols="12" class="mt-1">
              <v-btn text small @click="dialogOpened = true" class="link_text">
                不具合報告、要望など
              </v-btn>
            </v-col>
            <v-col cols="12" class="mt-1">
              <v-btn nuxt text small to="/about" class="link_text">
                このサイトについて
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="auto" align-self="end">
          <authorGroup></authorGroup>
        </v-col>
      </v-row>
    </v-footer>
    <form-dialog
      :formHeight="649"
      v-model="dialogOpened"
      src="https://docs.google.com/forms/d/e/1FAIpQLSfXFjVTye7n5CuDmTku8XSLHBjIB18YiDBidkSTJnjFXdyu6A/viewform?embedded=true"
    >
    </form-dialog>
  </v-app>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import {
    closeSelectedAchievementPanelHeight,
    headerHeight,
    maxAchievementCount,
    openSelectedAchievementPanelHeight,
    siteName,
  } from '~/common/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import siteIcon from '~/components/atoms/siteIcon.vue'
  import {
    AchievementSelectorStateStore,
    CharacterInfoStore,
    SelectedCharaInfoStore,
  } from '~/store'
  import aboutCharacterMenu from '~/components/layout/aboutCharacterMenu.vue'
  import headerLinkBtns from '~/components/layout/headerLinkBtns.vue'
  import supportPatchLabel from '~/components/layout/supportPatchLabel.vue'
  export default Vue.extend({
    components: {
      siteIcon,
      headerLinkBtns,
      aboutCharacterMenu,
      supportPatchLabel,
    },
    data() {
      return {
        baseSnackbarInfo: {
          color: 'primary',
          timeout: 3000,
        },
        snackbar: {
          text: '',
          color: 'primary-dark',
          visibled: false,
          timeout: 100000,
        },
        opennedCharacterInfo: false,
        dialogOpened: false,
      }
    },
    created() {
      this.setListener()
    },
    computed: {
      responseData(): ResponseData | null {
        return CharacterInfoStore.getResponseData
      },
      selectedCharacter(): CharacterInfo | null {
        return this.responseData?.characterData ?? null
      },
      footerStyle(): Object {
        return AchievementSelectorStateStore.getIsPanelShowing
          ? {
              marginBottom: `${this.selectedAchievementPanelHeight}px`,
            }
          : {}
      },
      selectedAchievementPanelHeight(): number {
        return AchievementSelectorStateStore.getIsPanelOpened
          ? openSelectedAchievementPanelHeight
          : closeSelectedAchievementPanelHeight
      },
      maxAchievementCount() {
        return maxAchievementCount
      },
      selectedAchievementLength() {
        return SelectedCharaInfoStore.getAchievements.length ?? 0
      },
      siteName() {
        return siteName
      },
      headerHeight() {
        return headerHeight
      },
      tooltipColor(): string {
        return this.$vuetify.theme.dark
          ? 'orange lighten-4'
          : 'indigo lighten-4'
      },
      linkItems(): LinkItem[] {
        return [
          {
            title: 'キャラクター選択',
            icon: 'fas fa-user-plus',
            link: '/',
          },
          {
            title: 'アチーブメント選択',
            icon: 'fas fa-star',
            link: '/selectAchievement',
            disabled: !this.selectedCharacter,
          },
          {
            title: '名刺デザイン編集',
            icon: 'far fa-id-card',
            link: '/editCharaCard',
            disabled: !this.selectedCharacter,
          },
        ]
      },
    },
    methods: {
      setListener() {
        this.$nuxt.$on(OUTPUT_SNACKBAR, this.showSnackbar)
      },
      showSnackbar(snackbarInfo: emitOutputSnackbar) {
        this.snackbar.visibled = false
        // DOMが更新されてからでなければtimeoutがリセットされない
        this.$nextTick(() => {
          this.snackbar.text = snackbarInfo.text
          this.snackbar.color =
            snackbarInfo.color || this.baseSnackbarInfo.color
          this.snackbar.timeout =
            snackbarInfo.timeout || this.baseSnackbarInfo.timeout
          this.snackbar.visibled = true
        })
      },
    },
  })
</script>
<style lang="scss" scoped>
  .app_bar {
    z-index: 100 !important;
    color: #fff;
  }
  .app_bar_title {
    color: #fff;
    text-decoration: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .app_bar_link {
    font-size: 16px;
  }
  .footer {
    font-size: 12px;
  }
  .header_text {
    font-size: 20px;
  }
  .link_text {
    text-decoration: none;
    font-weight: bold;
  }
</style>
