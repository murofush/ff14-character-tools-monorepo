import { type JSX } from 'react'
import { Button } from '../../../shared/ui/button'
import { useAppSnackbar } from '../context/AppSnackbarContext'
import { type SnackbarColor } from '../lib/snackbarModel'

/** 目的: スナックバー色種別に応じた表示クラスを返す。副作用: なし。前提: color は定義済み列挙値である。 */
function getSnackbarColorClassName(color: SnackbarColor): string {
  switch (color) {
    case 'error':
      return 'border-red-300 bg-red-600 text-white'
    case 'success':
      return 'border-emerald-300 bg-emerald-600 text-white'
    case 'warning':
      return 'border-amber-300 bg-amber-500 text-white'
    case 'info':
      return 'border-sky-300 bg-sky-600 text-white'
    case 'primary':
    default:
      return 'border-[var(--line)] bg-[var(--brand)] text-white'
  }
}

/** 目的: 全画面共通通知レイヤーとしてスナックバーを描画する。副作用: 閉じる操作で通知状態を更新する。前提: AppSnackbarProvider配下で利用する。 */
export function AppSnackbarLayer(): JSX.Element | null {
  const { snackbar, hideSnackbar } = useAppSnackbar()

  if (!snackbar.visible) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg ${getSnackbarColorClassName(snackbar.color)}`}
      >
        <p className="text-sm font-medium">{snackbar.text}</p>
        <Button type="button" size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={hideSnackbar}>
          閉じる
        </Button>
      </div>
    </div>
  )
}
