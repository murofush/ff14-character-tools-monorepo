<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" :clipped="clipped" fixed app>
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item to="/tag" router exact>
          <v-list-item-content>
            <v-list-item-title v-text="'タグ'"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/patch" router exact>
          <v-list-item-content>
            <v-list-item-title v-text="'パッチ'"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar :clipped-left="clipped" fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title v-text="title" />
      <v-spacer></v-spacer>
      <login-button></login-button>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-snackbar
          v-model="snackbar.visibled"
          bottom
          :color="snackbar.color"
          :timeout="snackbar.timeout"
        >
          {{ snackbar.text }}
          <template v-slot:action="{ attrs }">
            <v-btn
              color="white"
              text
              v-bind="attrs"
              @click="snackbar.visibled = false"
              >閉じる
            </v-btn>
          </template>
        </v-snackbar>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="10">
            <nuxt />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <v-footer :absolute="!fixed" app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import { KIND } from '@murofush/forfan-common-package/lib/const'
import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
import loginButton from '~/components/loginButton.vue'
export default Vue.extend({
  components: {
    loginButton,
  },
  data() {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      baseSnackbarInfo: {
        color: 'primary',
        timeout: 3000,
      },
      snackbar: {
        text: '',
        color: '',
        visibled: false,
        timeout: -1,
      },
      right: true,
      title: '',
    }
  },
  computed: {
    // TODO: ここanyから型を定義する。
    items(): any[] {
      const items = []
      for (const [key, value] of Object.entries(KIND)) {
        items.push({ title: value.name, to: `/${key}` })
      }
      return items
    },
  },
  created() {
    this.setListener()
  },
  methods: {
    setListener() {
      this.$nuxt.$on(OUTPUT_SNACKBAR, this.showSnackbar)
    },
    showSnackbar(snackbarInfo: EmitOutputSnackbar) {
      this.snackbar.visibled = false
      // DOMが更新されてからでなければtimeoutがリセットされない
      this.$nextTick(() => {
        this.snackbar.text = snackbarInfo.text
        this.snackbar.color = snackbarInfo.color || this.baseSnackbarInfo.color
        this.snackbar.timeout =
          snackbarInfo.timeout || this.baseSnackbarInfo.timeout
        this.snackbar.visibled = true
      })
    },
  },
})
</script>
