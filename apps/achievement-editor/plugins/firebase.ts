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
  interface Store<S> {
    $rtdb: firebase.database.Database
    $auth: firebase.auth.Auth
  }
}

const myPlugin: Plugin = (_, inject) => {
  if (firebase.apps.length === 0) {
    firebase.initializeApp({
      apiKey: 'AIzaSyBpviZduC4sEVCRC3ZQGMM0elV-RWnsGtk',
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
