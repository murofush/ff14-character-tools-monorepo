import {
  type JSX,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  createSnackbarState,
  createSnackbarStateFromPayload,
  type SnackbarPayload,
  type SnackbarState,
} from '../lib/snackbarModel'

type AppSnackbarContextValue = {
  snackbar: SnackbarState
  showSnackbar: (payload: SnackbarPayload) => void
  hideSnackbar: () => void
}

const AppSnackbarContext = createContext<AppSnackbarContextValue | null>(null)

/** 目的: 全画面共通スナックバー状態と操作関数を提供する。副作用: setTimeoutで自動クローズを制御する。前提: Appルートで単一配置する。 */
export function AppSnackbarProvider({ children }: { children: ReactNode }): JSX.Element {
  const [snackbar, setSnackbar] = useState<SnackbarState>(createSnackbarState)
  const timerRef = useRef<number | null>(null)

  /** 目的: 既存の自動クローズタイマーを安全に破棄する。副作用: タイマーをclearする。前提: timerRefはwindow.setTimeoutで設定される。 */
  const clearSnackbarTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** 目的: スナックバーを非表示化する。副作用: visible stateをfalseへ更新する。前提: 通知が表示中または非表示状態である。 */
  const hideSnackbar = useCallback((): void => {
    clearSnackbarTimer()
    setSnackbar((currentState) => ({
      ...currentState,
      visible: false,
    }))
  }, [clearSnackbarTimer])

  /** 目的: payloadを受け取り共通スナックバーへ表示する。副作用: 連続通知時に既存表示を上書きし、timeoutで自動クローズする。前提: payload.textは必須。 */
  const showSnackbar = useCallback(
    (payload: SnackbarPayload): void => {
      clearSnackbarTimer()
      setSnackbar((currentState) => {
        const nextState = createSnackbarStateFromPayload(payload, currentState.sequence + 1)

        if (nextState.timeout > 0) {
          timerRef.current = window.setTimeout(() => {
            setSnackbar((latestState) => ({
              ...latestState,
              visible: false,
            }))
            timerRef.current = null
          }, nextState.timeout)
        }

        return nextState
      })
    },
    [clearSnackbarTimer]
  )

  useEffect(() => {
    return () => {
      clearSnackbarTimer()
    }
  }, [clearSnackbarTimer])

  const contextValue = useMemo<AppSnackbarContextValue>(
    () => ({
      snackbar,
      showSnackbar,
      hideSnackbar,
    }),
    [hideSnackbar, showSnackbar, snackbar]
  )

  return <AppSnackbarContext.Provider value={contextValue}>{children}</AppSnackbarContext.Provider>
}

/** 目的: 共通スナックバー操作を利用するhookを提供する。副作用: なし。前提: AppSnackbarProvider配下で呼び出す。 */
export function useAppSnackbar(): AppSnackbarContextValue {
  const contextValue = useContext(AppSnackbarContext)
  if (!contextValue) {
    throw new Error('useAppSnackbar は AppSnackbarProvider 配下で使用してください。')
  }
  return contextValue
}
