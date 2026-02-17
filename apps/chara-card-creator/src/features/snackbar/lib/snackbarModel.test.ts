import { describe, expect, test } from 'vitest'
import {
  BASE_SNACKBAR_CONFIG,
  createSnackbarState,
  createSnackbarStateFromPayload,
  type SnackbarPayload,
} from './snackbarModel'

/** 目的: テスト用の通知payloadを生成する。副作用: なし。前提: textは空文字でない。 */
function createPayload(overrides: Partial<SnackbarPayload> = {}): SnackbarPayload {
  return {
    text: '保存しました。',
    ...overrides,
  }
}

describe('snackbarModel', () => {
  test('payload未指定項目にデフォルトcolor/timeoutを補完する', () => {
    const state = createSnackbarStateFromPayload(createPayload(), 1)

    expect(state.text).toBe('保存しました。')
    expect(state.color).toBe(BASE_SNACKBAR_CONFIG.color)
    expect(state.timeout).toBe(BASE_SNACKBAR_CONFIG.timeout)
    expect(state.visible).toBe(true)
    expect(state.sequence).toBe(1)
  })

  test('payload指定のcolor/timeoutを優先する', () => {
    const state = createSnackbarStateFromPayload(
      createPayload({ color: 'error', timeout: 5500 }),
      2
    )

    expect(state.color).toBe('error')
    expect(state.timeout).toBe(5500)
    expect(state.sequence).toBe(2)
  })

  test('空状態を生成できる', () => {
    const emptyState = createSnackbarState()

    expect(emptyState.visible).toBe(false)
    expect(emptyState.text).toBe('')
    expect(emptyState.timeout).toBe(BASE_SNACKBAR_CONFIG.timeout)
    expect(emptyState.color).toBe(BASE_SNACKBAR_CONFIG.color)
  })
})
