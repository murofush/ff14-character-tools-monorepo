export type SnackbarColor = 'primary' | 'error' | 'success' | 'warning' | 'info'

export type SnackbarPayload = {
  text: string
  color?: SnackbarColor
  timeout?: number
}

export type SnackbarConfig = {
  color: SnackbarColor
  timeout: number
}

export type SnackbarState = {
  text: string
  color: SnackbarColor
  timeout: number
  visible: boolean
  sequence: number
}

export const BASE_SNACKBAR_CONFIG: SnackbarConfig = {
  color: 'primary',
  timeout: 3000,
}

/** 目的: 非表示状態のスナックバー初期値を生成する。副作用: なし。前提: 共通通知レイヤーの初期描画で利用する。 */
export function createSnackbarState(): SnackbarState {
  return {
    text: '',
    color: BASE_SNACKBAR_CONFIG.color,
    timeout: BASE_SNACKBAR_CONFIG.timeout,
    visible: false,
    sequence: 0,
  }
}

/** 目的: 通知payloadを表示用stateへ正規化し、既定値を補完する。副作用: なし。前提: payload.text は表示可能文字列である。 */
export function createSnackbarStateFromPayload(
  payload: SnackbarPayload,
  sequence: number
): SnackbarState {
  return {
    text: payload.text,
    color: payload.color ?? BASE_SNACKBAR_CONFIG.color,
    timeout: payload.timeout ?? BASE_SNACKBAR_CONFIG.timeout,
    visible: true,
    sequence,
  }
}
