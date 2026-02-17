import {
  type CardColor,
  type CardEditorSettings,
  type CardLayout,
  type CropFocus,
  type CropRect,
} from '../model/types'

const DEFAULT_CARD_COLOR_LIGHT: CardColor = {
  backgroundColor: '#FFFFFF',
  textColor: '#0F0F0F',
  accentColor: '#ed7e28',
}

const DEFAULT_CARD_COLOR_DARK: CardColor = {
  backgroundColor: '#333333',
  textColor: '#FFFFFF',
  accentColor: '#ed7e28',
}

const LEGACY_CARD_HEIGHT_RATIO = 9 / 16
const LEGACY_SIDE_IMAGE_RATIO = 9 / 16
const LEGACY_WIDTH_SPACE_MULTIPLIER = 4

export const CARD_CANVAS_WIDTH = 1600
export const CARD_CANVAS_HEIGHT = 900

export const FONT_JP_LIST: string[] = [
  'Noto Sans JP',
  'Noto Serif JP',
  'Kosugi Maru',
  'Yusei Magic',
  'Potta One',
  'Dela Gothic One',
  'Hachi Maru Pop',
  'Reggae One',
  'DotGothic16',
  'stick',
]

export const FONT_EN_LIST: string[] = [
  'Roboto Condensed',
  'Open Sans',
  'Shadows Into Light',
  'Abril Fatface',
  'Pacifico',
]

/** 目的: 数値を指定範囲へ丸める。副作用: なし。前提: min <= max を満たす。 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 目的: テーマに対応する既定配色を返す。副作用: なし。前提: themeは `light` または `dark`。 */
export function resolveThemeCardColor(theme: 'light' | 'dark'): CardColor {
  return theme === 'dark' ? { ...DEFAULT_CARD_COLOR_DARK } : { ...DEFAULT_CARD_COLOR_LIGHT }
}

/** 目的: 編集設定の配色を現在テーマの既定値へ戻す。副作用: なし。前提: settingsは既存の編集状態を保持している。 */
export function resetCardColorForTheme(settings: CardEditorSettings): CardEditorSettings {
  return {
    ...settings,
    cardColor: resolveThemeCardColor(settings.theme),
  }
}

/** 目的: 編集設定からプレビュー適用色を算出する。副作用: なし。前提: cardColor は16進色文字列で保持される。 */
export function resolveActiveCardColor(settings: CardEditorSettings): CardColor {
  if (settings.isCardColorChangeable) {
    return {
      textColor: settings.cardColor.textColor,
      backgroundColor: settings.cardColor.backgroundColor,
      accentColor: settings.cardColor.accentColor,
    }
  }
  return resolveThemeCardColor(settings.theme)
}

/** 目的: カード編集設定の初期値を返す。副作用: なし。前提: description は復元済み自己紹介文を受け取る。 */
export function getDefaultCardEditorSettings(description: string): CardEditorSettings {
  return {
    description,
    theme: 'light',
    cardColor: resolveThemeCardColor('light'),
    isCardColorChangeable: false,
    nameTextBold: false,
    infoTextBold: false,
    charaNameFontFamily: FONT_JP_LIST[0] ?? 'Noto Sans JP',
    charaInfoFontFamilyJP: FONT_JP_LIST[0] ?? 'Noto Sans JP',
    charaInfoFontFamilyEN: null,
    charaInfoFontFamilyENEnabled: false,
    isFullSizeImage: false,
    isImageRight: false,
    widthSpace: 0,
    infoBackgroundOpacity: 1,
    disabledBeforeUnlockAccent: false,
  }
}

/** 目的: 画像レイアウト設定からトリミング比率を返す。副作用: なし。前提: 全画面は16:9、通常は9:16で扱う。 */
export function resolveCropRatio(isFullSizeImage: boolean): number {
  return isFullSizeImage ? 16 / 9 : 9 / 16
}

/** 目的: 元画像から目標比率で切り出す矩形を計算する。副作用: なし。前提: imageWidth/imageHeight/targetRatio は正数である。 */
export function calculateCropRect(
  imageWidth: number,
  imageHeight: number,
  targetRatio: number,
  focus: CropFocus
): CropRect {
  const normalizedTargetRatio: number = targetRatio > 0 ? targetRatio : 9 / 16
  const sourceRatio: number = imageWidth / imageHeight
  const focusX: number = (clamp(focus.x, -1, 1) + 1) / 2
  const focusY: number = (clamp(focus.y, -1, 1) + 1) / 2

  if (sourceRatio > normalizedTargetRatio) {
    const sourceHeight: number = imageHeight
    const sourceWidth: number = imageHeight * normalizedTargetRatio
    const sourceX: number = (imageWidth - sourceWidth) * focusX
    return {
      sourceX,
      sourceY: 0,
      sourceWidth,
      sourceHeight,
    }
  }

  const sourceWidth: number = imageWidth
  const sourceHeight: number = imageWidth / normalizedTargetRatio
  const sourceY: number = (imageHeight - sourceHeight) * focusY
  return {
    sourceX: 0,
    sourceY,
    sourceWidth,
    sourceHeight,
  }
}

/** 目的: 旧VueのwidthSpace互換値（0..100）をCanvasピクセル量へ変換する。副作用: なし。前提: 全画面モード時のみ有効化する。 */
function resolveLegacyWidthSpacePixels(isFullSizeImage: boolean, widthSpace: number): number {
  if (!isFullSizeImage) {
    return 0
  }
  return Math.round(clamp(widthSpace, 0, 100) * LEGACY_WIDTH_SPACE_MULTIPLIER)
}

/** 目的: プレビュー/保存で共通利用する画像領域と情報領域の配置を旧Canvas互換で計算する。副作用: なし。前提: 旧実装では出力比率16:9を固定で扱う。 */
export function buildCardLayout(
  canvasWidth: number,
  canvasHeight: number,
  isFullSizeImage: boolean,
  isImageRight: boolean,
  widthSpace: number
): CardLayout {
  const sideImageWidth: number = Math.round(canvasWidth * LEGACY_CARD_HEIGHT_RATIO * LEGACY_SIDE_IMAGE_RATIO)
  const widthSpacePixels: number = resolveLegacyWidthSpacePixels(isFullSizeImage, widthSpace)

  const infoPanelXRaw: number = isImageRight ? 0 : sideImageWidth + widthSpacePixels
  const infoPanelWidthRaw: number = canvasWidth - (sideImageWidth + widthSpacePixels)

  return {
    canvasWidth,
    canvasHeight,
    mainImageRect: {
      x: isImageRight && !isFullSizeImage ? canvasWidth - sideImageWidth : 0,
      y: 0,
      width: isFullSizeImage ? canvasWidth : sideImageWidth,
      height: canvasHeight,
    },
    infoPanelRect: {
      x: clamp(infoPanelXRaw, 0, canvasWidth),
      y: 0,
      width: clamp(infoPanelWidthRaw, 0, canvasWidth),
      height: canvasHeight,
    },
  }
}

/** 目的: 設定に応じた実効フォントファミリーを返す。副作用: なし。前提: 英数字専用フォントは任意設定とする。 */
export function buildInfoFontFamily(settings: CardEditorSettings): string {
  if (settings.charaInfoFontFamilyENEnabled && settings.charaInfoFontFamilyEN) {
    return `${settings.charaInfoFontFamilyEN}, ${settings.charaInfoFontFamilyJP}`
  }
  return settings.charaInfoFontFamilyJP
}

/** 目的: unknownなcharacterDataから表示用の名前を構築する。副作用: なし。前提: firstName/lastName は文字列で保持される。 */
export function extractCharacterDisplayName(characterData: Record<string, unknown>): string {
  const firstName: string = typeof characterData.firstName === 'string' ? characterData.firstName : ''
  const lastName: string = typeof characterData.lastName === 'string' ? characterData.lastName : ''
  const fullName: string = `${firstName} ${lastName}`.trim()
  return fullName === '' ? 'Unknown Character' : fullName
}

/** 目的: unknownなcharacterDataから補助表示（ワールド/DC/種族）を構築する。副作用: なし。前提: 不足項目は表示文字列から除外する。 */
export function extractCharacterMetaLine(characterData: Record<string, unknown>): string {
  const server: string = typeof characterData.server === 'string' ? characterData.server : ''
  const datacenter: string = typeof characterData.datacenter === 'string' ? characterData.datacenter : ''
  const race: string = typeof characterData.race === 'string' ? characterData.race : ''
  const clan: string = typeof characterData.clan === 'string' ? characterData.clan : ''
  const gender: string = typeof characterData.gender === 'string' ? characterData.gender : ''

  const worldPart: string = [server, datacenter].filter((value) => value !== '').join(' / ')
  const racePart: string = [race, clan, gender].filter((value) => value !== '').join(' ')
  return [worldPart, racePart].filter((value) => value !== '').join(' | ')
}
