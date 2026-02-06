import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { FirebaseAuthUser } from '@murofush/forfan-common-package/lib/types'
import firebase from 'firebase/app'
import 'firebase/auth'

@Module({
  name: 'auth',
  stateFactory: true,
  namespaced: true,
})
export default class AuthModule extends VuexModule {
  private authedUser: FirebaseAuthUser | null = null
  private idToken: string | null = null

  public get getAuthedUser() {
    return this.authedUser
  }

  public get getIdToken() {
    return this.idToken
  }

  @Mutation
  setAuthedUser(authedUser: FirebaseAuthUser | null) {
    this.authedUser = authedUser
  }

  @Mutation
  setIdToken(idToken: string | null) {
    this.idToken = idToken
  }

  @Action
  signInWithRedirect() {
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase.auth().signInWithRedirect(provider)
  }

  @Action
  async signin(user: firebase.User) {
    this.setAuthedUser({
      displayName: user.displayName || 'Anonymous',
      photoURL:
        user.photoURL ||
        'https://dummyimage.com/150x150/000/ffffff.png&text=dummy',
      uid: user.uid,
    })
    const idToken = await user.getIdToken()
    this.setIdToken(idToken)
  }

  @Action
  signout() {
    this.setAuthedUser(null)
    this.setIdToken(null)
  }
}
