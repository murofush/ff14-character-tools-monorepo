// i18n対応した場合はこちらを適用させること
// export const LOADSTONE_CHARA_PAGE_REGPEX = /https:\/\/(jp|na|eu|fr|de).finalfantasyxiv.com\/lodestone\/character\/[0-9]+\/?$/

import { LOADSTONE_URL } from '@murofush/forfan-common-package/lib/const'
import { LocalError } from '@murofush/forfan-common-package/lib/types'

export const siteName = 'AboutMe.ForFan'

export const LOADSTONE_CHARACTER_URL = `${LOADSTONE_URL}/lodestone/character`
export const LOADSTONE_CHARA_PAGE_REGPEX =
  /https:\/\/jp.finalfantasyxiv.com\/lodestone\/character\/([0-9]+)\/?$/
export const ACHIEVEMENT_PATH = '/achievement/kind/'

export const PRIVATE_ACHIEVEMENT = {
  key: 'private_achievement_data',
  value: 'アチーブメントページがプライベートに設定されています。',
} as LocalError

export const tabsHeight = 48

// v-stepper-step > v-stepper-headerのheight(72px)値
export const headerHeight = 64

export const borderHeight = 1

export const maxAchievementCount = 4

export const fabButtonSize = 64

export const navigationDrawerHeaderHeight = 48

export const fabMarginY = 8

/** v-expansion-panel > Sass Variable $expansion-panel-header-min-heightの値
 * https://vuetifyjs.com/ja/api/v-expansion-panel/#sass-expansion-panel-header-min-height
 */
export const closeSelectedAchievementPanelHeight = 48
// expansion_panel_content: 150px + .v-expansion-panel--active: 64px
export const openSelectedAchievementPanelHeight = 150 + 64

export const secondaryOpacity = 0.8

export const accentColor = '#ed7e28'

export const themeColor: { [key in Theme]: CardColor } = {
  light: {
    backgroundColor: '#FFFFFF',
    textColor: '#0F0F0F',
    accentColor: accentColor,
  },
  dark: {
    backgroundColor: '#333333',
    textColor: '#FFFFFF',
    accentColor: accentColor,
  },
}

export const fontJP: FontInfo[] = [
  { name: 'Noto Sans JP' },
  { name: 'Noto Serif JP' },
  { name: 'Kosugi Maru' },
  { name: 'Yusei Magic' },
  { name: 'Potta One' },
  { name: 'Dela Gothic One' },
  { name: 'Hachi Maru Pop' },
  { name: 'Reggae One' },
  { name: 'DotGothic16' },
  { name: 'stick' },
]

export const fontEN: FontInfo[] = [
  { name: 'Roboto Condensed' },
  { name: 'Open Sans' },
  { name: 'Shadows Into Light' },
  { name: 'Abril Fatface' },
  { name: 'Pacifico' },
]
