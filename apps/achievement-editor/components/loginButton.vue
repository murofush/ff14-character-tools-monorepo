<template>
  <v-row no-gutters align="center" justify="end" class="login_container">
    <v-col v-if="!user" cols="auto">
      <v-btn @click="loginEvent">ログイン</v-btn>
    </v-col>
    <v-col v-if="user" cols="12">
      <v-row no-gutters align="center" justify="end">
        <v-col cols="auto" class="mr-2">
          <v-avatar>
            <img :src="user.photoURL" />
          </v-avatar>
        </v-col>
        <v-col cols="auto">
          <span
            ><span class="user_label">Name:</span> {{ user.displayName }}</span
          >
          <br />
          <span><span class="user_label">Uid:</span> {{ user.uid }}</span>
        </v-col>
        <v-col cols="auto">
          <v-btn @click="logoutEvent">ログアウト</v-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue from 'vue'
import { FirebaseAuthUser } from '@murofush/forfan-common-package/lib/types'
import { AuthStore } from '~/store'
export default Vue.extend({
  computed: {
    user(): FirebaseAuthUser | null {
      return AuthStore.getAuthedUser
    },
  },
  mounted() {
    this.$auth.onAuthStateChanged(async (user) => {
      if (user) {
        await AuthStore.signin(user)
      } else {
        AuthStore.signout()
      }
    })
  },
  methods: {
    loginEvent() {
      AuthStore.signInWithRedirect()
    },
    async logoutEvent() {
      await this.$auth.signOut()
    },
  },
})
</script>
<style lang="scss" scoped>
.user_label {
  -ms-user-select: none; /* IE 10+ */
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  color: #aaa;
  font-size: 12px;
}
</style>
