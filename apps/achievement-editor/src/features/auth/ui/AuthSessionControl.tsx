import { type JSX } from 'react'
import { Badge } from '../../../shared/ui/badge'
import { Button } from '../../../shared/ui/button'
import { useAuthSession } from '../context/AuthSessionContext'

/** 目的: ヘッダ上で認証状態（未ログイン/ログイン済み）と操作導線を表示する。副作用: signIn/signOut実行で認証状態を変更する。前提: AuthSessionProvider配下で利用する。 */
export function AuthSessionControl(): JSX.Element {
  const { mode, status, user, errorMessage, signIn, signOut } = useAuthSession()

  if (mode === 'static') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="subtle">Static</Badge>
        <span className="text-xs text-[var(--ink-subtle)]">
          {status === 'signed_in' ? '固定トークン運用中' : '固定トークン未設定'}
        </span>
      </div>
    )
  }

  if (status === 'checking') {
    return <span className="text-xs text-[var(--ink-subtle)]">認証状態を確認中...</span>
  }

  if (status === 'signed_in' && user) {
    return (
      <div className="flex items-center gap-2">
        <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full border border-[var(--line)]" />
        <div className="hidden text-xs leading-tight text-[var(--ink-subtle)] 2xl:block">
          <p>{user.displayName}</p>
          <p>{user.uid}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void signOut()}>
          ログアウト
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => void signIn()}>
        ログイン
      </Button>
      {errorMessage !== '' ? (
        <span className="hidden text-xs text-[var(--danger)] 2xl:inline">{errorMessage}</span>
      ) : null}
    </div>
  )
}
