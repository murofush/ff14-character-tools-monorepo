import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
import { Plugin } from '@nuxt/types'

declare module 'vue/types/vue' {
  interface Vue {
    $rtdb: firebase.database.Database
    $auth: firebase.auth.Auth
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $rtdb: firebase.database.Database
    $auth: firebase.auth.Auth
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Store<S> {
    $rtdb: firebase.database.Database
    $auth: firebase.auth.Auth
  }
}

/**
 * 目的: Firebase の API キーを環境変数から取得して秘密情報の直書きを防止する。
 * 副作用: API キー未設定時に警告ログを出力する。
 * 前提: `FIREBASE_API_KEY` が Nuxt 実行環境に設定されていること。
 */
const resolveFirebaseApiKey = (): string => {
  const firebaseApiKey: string | undefined = process.env.FIREBASE_API_KEY
  if (!firebaseApiKey) {
    // 旧資産互換のため初期化は継続し、運用環境で設定漏れを検知できるよう警告する。
    // eslint-disable-next-line no-console
    console.warn('[firebase] FIREBASE_API_KEY is not set.')
    return ''
  }
  return firebaseApiKey
}

/**
 * 目的: Firebase インスタンスを初期化して Nuxt の inject に登録する。
 * 副作用: 初回実行時に `firebase.initializeApp` を呼び出す。
 * 前提: Firebase の接続情報が有効であること。
 */
const myPlugin: Plugin = (
  _context: Parameters<Plugin>[0],
  inject: Parameters<Plugin>[1]
): void => {
  const apiKey: string = resolveFirebaseApiKey()
  if (firebase.apps.length === 0) {
    firebase.initializeApp({
      apiKey,
      authDomain: 'history-forfan.firebaseapp.com',
      databaseURL: 'https://history-forfan-default-rtdb.firebaseio.com',
      projectId: 'history-forfan',
      storageBucket: 'history-forfan.appspot.com',
      messagingSenderId: '18982335863',
      appId: '1:18982335863:web:d87fe8ae36edf1b2c95d72',
      measurementId: 'G-G56KN4RTN6',
    })
  }
  inject('rtdb', firebase.database())
  inject('auth', firebase.auth())
}

export default myPlugin
