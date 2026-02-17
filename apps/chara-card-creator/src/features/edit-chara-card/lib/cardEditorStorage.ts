import { type CardEditorImageState, type CardEditorSettings } from '../model/types'
import { getDefaultCardEditorSettings } from './cardEditorDomain'

const CARD_EDITOR_SETTINGS_STORAGE_KEY = 'ff14.chara_card.editor.settings'
const CARD_EDITOR_IMAGE_STORAGE_KEY = 'ff14.chara_card.editor.images'

/** 目的: unknown値がRecord型か判定する。副作用: なし。前提: JSON.parse結果を受け取る。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** 目的: 画像状態データの最小構造を検証する。副作用: なし。前提: 画像はDataURL文字列またはnullで保持する。 */
function isCardEditorImageState(value: unknown): value is CardEditorImageState {
  return (
    isRecord(value) &&
    (typeof value.sideMainImageDataUrl === 'string' || value.sideMainImageDataUrl === null) &&
    (typeof value.fullMainImageDataUrl === 'string' || value.fullMainImageDataUrl === null)
  )
}

/** 目的: カード編集設定の最小構造を検証する。副作用: なし。前提: 値域チェックはread関数側で実施する。 */
function isCardEditorSettings(value: unknown): value is CardEditorSettings {
  return (
    isRecord(value) &&
    typeof value.description === 'string' &&
    (value.theme === 'light' || value.theme === 'dark') &&
    isRecord(value.cardColor) &&
    typeof value.cardColor.textColor === 'string' &&
    typeof value.cardColor.backgroundColor === 'string' &&
    typeof value.cardColor.accentColor === 'string' &&
    typeof value.isCardColorChangeable === 'boolean' &&
    typeof value.nameTextBold === 'boolean' &&
    typeof value.infoTextBold === 'boolean' &&
    typeof value.charaNameFontFamily === 'string' &&
    typeof value.charaInfoFontFamilyJP === 'string' &&
    (typeof value.charaInfoFontFamilyEN === 'string' || value.charaInfoFontFamilyEN === null) &&
    typeof value.charaInfoFontFamilyENEnabled === 'boolean' &&
    typeof value.isFullSizeImage === 'boolean' &&
    typeof value.isImageRight === 'boolean' &&
    typeof value.widthSpace === 'number' &&
    typeof value.infoBackgroundOpacity === 'number' &&
    typeof value.disabledBeforeUnlockAccent === 'boolean'
  )
}

/** 目的: 画像状態の初期値を返す。副作用: なし。前提: ブラウザ再訪時に復元失敗しても継続できる。 */
export function createDefaultCardEditorImageState(): CardEditorImageState {
  return {
    sideMainImageDataUrl: null,
    fullMainImageDataUrl: null,
  }
}

/** 目的: localStorageからカード編集設定を復元する。副作用: 不正データ検出時に該当keyを削除する。前提: ブラウザ環境で実行する。 */
export function readCardEditorSettings(defaultDescription: string): CardEditorSettings {
  if (typeof window === 'undefined') {
    return getDefaultCardEditorSettings(defaultDescription)
  }
  const rawText: string | null = window.localStorage.getItem(CARD_EDITOR_SETTINGS_STORAGE_KEY)
  if (!rawText) {
    return getDefaultCardEditorSettings(defaultDescription)
  }
  try {
    const parsed: unknown = JSON.parse(rawText)
    if (!isCardEditorSettings(parsed)) {
      window.localStorage.removeItem(CARD_EDITOR_SETTINGS_STORAGE_KEY)
      return getDefaultCardEditorSettings(defaultDescription)
    }
    return {
      ...parsed,
      widthSpace: Math.max(0, Math.min(100, parsed.widthSpace)),
      infoBackgroundOpacity: Math.max(0, Math.min(1, parsed.infoBackgroundOpacity)),
    }
  } catch (_error) {
    window.localStorage.removeItem(CARD_EDITOR_SETTINGS_STORAGE_KEY)
    return getDefaultCardEditorSettings(defaultDescription)
  }
}

/** 目的: カード編集設定をlocalStorageへ保存する。副作用: localStorage書き込みを行う。前提: ブラウザ環境で実行する。 */
export function writeCardEditorSettings(settings: CardEditorSettings): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(CARD_EDITOR_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

/** 目的: localStorageから画像状態を復元する。副作用: 不正データ検出時に該当keyを削除する。前提: ブラウザ環境で実行する。 */
export function readCardEditorImageState(): CardEditorImageState {
  if (typeof window === 'undefined') {
    return createDefaultCardEditorImageState()
  }
  const rawText: string | null = window.localStorage.getItem(CARD_EDITOR_IMAGE_STORAGE_KEY)
  if (!rawText) {
    return createDefaultCardEditorImageState()
  }
  try {
    const parsed: unknown = JSON.parse(rawText)
    if (!isCardEditorImageState(parsed)) {
      window.localStorage.removeItem(CARD_EDITOR_IMAGE_STORAGE_KEY)
      return createDefaultCardEditorImageState()
    }
    return parsed
  } catch (_error) {
    window.localStorage.removeItem(CARD_EDITOR_IMAGE_STORAGE_KEY)
    return createDefaultCardEditorImageState()
  }
}

/** 目的: 画像状態をlocalStorageへ保存する。副作用: localStorage書き込みを行う。前提: ブラウザ環境で実行する。 */
export function writeCardEditorImageState(imageState: CardEditorImageState): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(CARD_EDITOR_IMAGE_STORAGE_KEY, JSON.stringify(imageState))
}

/** 目的: カード編集状態を初期化する。副作用: localStorageから設定と画像を削除する。前提: フローを手動リセットする時に呼ぶ。 */
export function clearCardEditorState(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(CARD_EDITOR_SETTINGS_STORAGE_KEY)
  window.localStorage.removeItem(CARD_EDITOR_IMAGE_STORAGE_KEY)
}
