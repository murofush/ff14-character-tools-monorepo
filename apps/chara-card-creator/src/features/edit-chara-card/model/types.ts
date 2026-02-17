export type CardTheme = 'light' | 'dark'

export type CardColor = {
  textColor: string
  backgroundColor: string
  accentColor: string
}

export type CropFocus = {
  x: number
  y: number
}

export type CropRect = {
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

export type CardRect = {
  x: number
  y: number
  width: number
  height: number
}

export type CardLayout = {
  canvasWidth: number
  canvasHeight: number
  mainImageRect: CardRect
  infoPanelRect: CardRect
}

export type CardEditorImageState = {
  sideMainImageDataUrl: string | null
  fullMainImageDataUrl: string | null
}

export type CardEditorSettings = {
  description: string
  theme: CardTheme
  cardColor: CardColor
  isCardColorChangeable: boolean
  nameTextBold: boolean
  infoTextBold: boolean
  charaNameFontFamily: string
  charaInfoFontFamilyJP: string
  charaInfoFontFamilyEN: string | null
  charaInfoFontFamilyENEnabled: boolean
  isFullSizeImage: boolean
  isImageRight: boolean
  widthSpace: number
  infoBackgroundOpacity: number
  disabledBeforeUnlockAccent: boolean
}
