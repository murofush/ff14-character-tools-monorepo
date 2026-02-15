import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

export type AuthMode = 'firebase' | 'static'

const LEGACY_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: 'AIzaSyBpviZduC4sEVCRC3ZQGMM0elV-RWnsGtk',
  authDomain: 'history-forfan.firebaseapp.com',
  databaseURL: 'https://history-forfan-default-rtdb.firebaseio.com',
  projectId: 'history-forfan',
  storageBucket: 'history-forfan.appspot.com',
  messagingSenderId: '18982335863',
  appId: '1:18982335863:web:d87fe8ae36edf1b2c95d72',
  measurementId: 'G-G56KN4RTN6',
}

let cachedAuth: Auth | null = null

/** 目的: `import.meta.env` から文字列環境変数を取得する。副作用: なし。前提: Vite環境で実行される。 */
function readEnvValue(key: string): string | undefined {
  const value = import.meta.env[key] as string | undefined
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/** 目的: 認証方式（firebase/static）を環境変数から判定する。副作用: なし。前提: 未設定時は firebase を既定採用する。 */
export function detectAuthMode(): AuthMode {
  const rawMode = (readEnvValue('VITE_ACHIEVEMENT_AUTH_MODE') ?? 'firebase').toLowerCase()
  return rawMode === 'static' ? 'static' : 'firebase'
}

/** 目的: 開発用固定Bearerトークンを環境変数から取得する。副作用: なし。前提: staticモードでのみ利用する。 */
export function getStaticBearerTokenFromEnv(): string {
  return readEnvValue('VITE_ACHIEVEMENT_BACKEND_TOKEN') ?? ''
}

/** 目的: Firebase設定値を環境変数優先で解決し、未指定項目は旧実装設定へフォールバックする。副作用: なし。前提: 旧実装互換を維持する。 */
function resolveFirebaseOptions(): FirebaseOptions {
  return {
    apiKey: readEnvValue('VITE_FIREBASE_API_KEY') ?? LEGACY_FIREBASE_CONFIG.apiKey,
    authDomain: readEnvValue('VITE_FIREBASE_AUTH_DOMAIN') ?? LEGACY_FIREBASE_CONFIG.authDomain,
    databaseURL:
      readEnvValue('VITE_FIREBASE_DATABASE_URL') ?? LEGACY_FIREBASE_CONFIG.databaseURL,
    projectId: readEnvValue('VITE_FIREBASE_PROJECT_ID') ?? LEGACY_FIREBASE_CONFIG.projectId,
    storageBucket:
      readEnvValue('VITE_FIREBASE_STORAGE_BUCKET') ?? LEGACY_FIREBASE_CONFIG.storageBucket,
    messagingSenderId:
      readEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID') ??
      LEGACY_FIREBASE_CONFIG.messagingSenderId,
    appId: readEnvValue('VITE_FIREBASE_APP_ID') ?? LEGACY_FIREBASE_CONFIG.appId,
    measurementId:
      readEnvValue('VITE_FIREBASE_MEASUREMENT_ID') ?? LEGACY_FIREBASE_CONFIG.measurementId,
  }
}

/** 目的: Firebase Authインスタンスをシングルトンとして初期化して返す。副作用: Firebase App初期化を実行する。前提: firebaseモードで呼び出す。 */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth
  }

  const options = resolveFirebaseOptions()
  if (!options.apiKey || !options.authDomain || !options.projectId || !options.appId) {
    throw new Error('Firebase 設定が不足しています。環境変数を確認してください。')
  }

  const app = getApps().length === 0 ? initializeApp(options) : getApp()
  cachedAuth = getAuth(app)
  return cachedAuth
}
