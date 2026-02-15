import { type JSX, type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import {
  configureAuthTokenProvider,
  configureStaticBearerToken,
} from '../lib/authTokenClient'
import {
  detectAuthMode,
  getFirebaseAuth,
  getStaticBearerTokenFromEnv,
  type AuthMode,
} from '../lib/firebaseAuthClient'

export type AuthSessionStatus = 'checking' | 'signed_out' | 'signed_in'

export type AuthSessionUser = {
  displayName: string
  photoURL: string
  uid: string
}

type AuthSessionContextValue = {
  mode: AuthMode
  status: AuthSessionStatus
  user: AuthSessionUser | null
  errorMessage: string
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

/** 目的: Firebase Userを表示用の最小情報へ変換する。副作用: なし。前提: userはFirebase認証済みユーザーである。 */
function mapAuthSessionUser(user: User): AuthSessionUser {
  return {
    displayName: user.displayName ?? 'Anonymous',
    photoURL:
      user.photoURL ??
      'https://dummyimage.com/150x150/000/ffffff.png&text=dummy',
    uid: user.uid,
  }
}

/** 目的: staticモード時の疑似ユーザー情報を生成する。副作用: なし。前提: tokenが存在する場合のみ呼び出す。 */
function createStaticModeUser(): AuthSessionUser {
  return {
    displayName: 'Static Token User',
    photoURL: 'https://dummyimage.com/150x150/000/ffffff.png&text=static',
    uid: 'static-token',
  }
}

/** 目的: firebaseログアウトを安全に実行する。副作用: Firebaseセッションを破棄する。前提: authは初期化済みである。 */
async function signOutSafely(auth: Auth): Promise<void> {
  await signOut(auth)
}

/** 目的: 認証セッション状態とAPIトークン供給設定を子ツリーへ提供する。副作用: Firebase認証購読とグローバルtoken provider設定を行う。前提: Appルートで一度だけ配置する。 */
export function AuthSessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const mode = useMemo((): AuthMode => detectAuthMode(), [])
  const staticBearerToken = useMemo((): string => getStaticBearerTokenFromEnv(), [])
  const [status, setStatus] = useState<AuthSessionStatus>(mode === 'firebase' ? 'checking' : 'signed_out')
  const [user, setUser] = useState<AuthSessionUser | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null)

  /** 目的: 現在セッションでログアウトを実行する。副作用: Firebaseセッション解除とUI状態リセットを行う。前提: firebaseモードで利用する。 */
  const signOutSession = useCallback(async (): Promise<void> => {
    if (mode === 'firebase' && firebaseAuth) {
      await signOutSafely(firebaseAuth)
    }
    setStatus('signed_out')
    setUser(null)
  }, [firebaseAuth, mode])

  /** 目的: 現在セッションでログインを開始する。副作用: Firebase Google認証のリダイレクトを実行する。前提: firebaseモードで利用する。 */
  const signInSession = useCallback(async (): Promise<void> => {
    if (mode !== 'firebase' || !firebaseAuth) {
      return
    }
    await signInWithRedirect(firebaseAuth, new GoogleAuthProvider())
  }, [firebaseAuth, mode])

  useEffect(() => {
    if (mode === 'static') {
      const hasStaticToken = staticBearerToken !== ''
      setStatus(hasStaticToken ? 'signed_in' : 'signed_out')
      setUser(hasStaticToken ? createStaticModeUser() : null)
      setErrorMessage('')
      setFirebaseAuth(null)
      return
    }

    try {
      setFirebaseAuth(getFirebaseAuth())
      setStatus('checking')
      setErrorMessage('')
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setFirebaseAuth(null)
      setStatus('signed_out')
      setUser(null)
      setErrorMessage(`Firebase初期化に失敗しました: ${reason}`)
    }
  }, [mode, staticBearerToken])

  useEffect(() => {
    if (mode !== 'firebase' || firebaseAuth === null) {
      return
    }

    /** 目的: Firebase認証状態変更を購読してUI状態へ同期する。副作用: status/user/errorMessage stateを更新する。前提: firebaseAuthは有効である。 */
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setStatus('signed_out')
        setUser(null)
        setErrorMessage('')
        return
      }

      try {
        await firebaseUser.getIdToken()
        setStatus('signed_in')
        setUser(mapAuthSessionUser(firebaseUser))
        setErrorMessage('')
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        setStatus('signed_out')
        setUser(null)
        setErrorMessage(`トークン取得に失敗しました: ${reason}`)
      }
    })

    return (): void => {
      unsubscribe()
    }
  }, [firebaseAuth, mode])

  useEffect(() => {
    configureStaticBearerToken(mode === 'static' ? staticBearerToken : null)

    if (mode !== 'firebase' || firebaseAuth === null) {
      configureAuthTokenProvider(null)
      return
    }

    configureAuthTokenProvider({
      getAccessToken: async (options?: { forceRefresh?: boolean }): Promise<string | null> => {
        const currentUser = firebaseAuth.currentUser
        if (!currentUser) {
          return null
        }
        return currentUser.getIdToken(options?.forceRefresh ?? false)
      },
      onUnauthorized: (): void => {
        void signOutSession()
      },
    })

    return (): void => {
      configureAuthTokenProvider(null)
    }
  }, [firebaseAuth, mode, signOutSession, staticBearerToken])

  const contextValue = useMemo<AuthSessionContextValue>(
    () => ({
      mode,
      status,
      user,
      errorMessage,
      signIn: signInSession,
      signOut: signOutSession,
    }),
    [errorMessage, mode, signInSession, signOutSession, status, user]
  )

  return <AuthSessionContext.Provider value={contextValue}>{children}</AuthSessionContext.Provider>
}

/** 目的: 認証セッション状態を参照するためのhookを提供する。副作用: なし。前提: AuthSessionProvider配下で呼び出す。 */
export function useAuthSession(): AuthSessionContextValue {
  const contextValue = useContext(AuthSessionContext)
  if (!contextValue) {
    throw new Error('useAuthSession は AuthSessionProvider 配下で使用してください。')
  }
  return contextValue
}
