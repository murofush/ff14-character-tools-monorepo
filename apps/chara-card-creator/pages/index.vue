<template>
  <v-row justify="center" class="container_main">
    <v-col cols="11" sm="9" md="8">
      <v-row justify="center">
        <v-col cols="12">
          <edit-chara-selector
            :id="characterSelectorID"
            class="pa-3"
            @selected="selectedFetchedCharacter"
            @clickQuestion="clickQuestion"
            @output_snackbar="showSnackbar"
          />
        </v-col>
        <v-col cols="auto">
          <v-img :aspect-ratio="3 / 2" width="600px" src="img/home.png" />
        </v-col>
        <v-col cols="12" id="howTo">
          <h2 class="how_to_header">なにこれ</h2>
        </v-col>
        <v-col cols="12">
          キャラクターの情報からデジタル名刺を作るサービスです。
          アチーブメント情報を公開してたらアチーブメントの情報を追加したり、自動でアチーブメントの履歴から開始時期を追記したりしてくれます。
        </v-col>
        <v-col cols="12" id="howTo">
          <h2 class="how_to_header">つかいかた</h2>
        </v-col>
        <v-col cols="12">
          <v-row justify="center" align="center" no-gutters>
            <v-col cols="12" lg="6" class="mb-1">
              <v-icon large color="primary" class="mb-1">
                mdi-numeric-1-circle
              </v-icon>
              <div>
                「
                <a
                  href="https://jp.finalfantasyxiv.com/lodestone"
                  target="_blank"
                >
                  FINAL FANTASY XIV, The Lodestone
                </a>
                」の
                <span class="code_text" :style="codeTextColor">
                  マイメニュー > マイキャラクター
                </span>
                から、取得したいキャラクターのキャラクターページのURL(
                <span class="code_text" :style="codeTextColor"
                  >https://jp.finalfantasyxiv.com/lodestone/character/[CharacterID]</span
                >
                )または、<span class="code_text" :style="codeTextColor">
                  [CharacterID]
                </span>
                をコピー。
              </div>
            </v-col>
            <v-col cols="12" lg="6">
              <v-img
                class="mx-3"
                src="img/home/1_1.png"
                :height="howToHeight"
                contain
              >
              </v-img>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" class="end_how_to">
          <v-icon large color="primary" class="mb-1">
            mdi-numeric-2-circle
          </v-icon>
          <div class="mb-2">
            1.でコピーしたURLを「
            <nuxt-link
              v-scroll-to="{
                el: `#${characterSelectorID}`,
                offset: -headerHeight,
              }"
              to
            >
              新規キャラクターから名刺を作成
            </nuxt-link>
            」ペーストして「取得」をクリック。
          </div>
          <div>
            データが取得されたらこのサイトに従ってデジタル名刺を作成しましょう！
          </div>
        </v-col>
        <v-col cols="12">
          <v-row justify="center" align="center" no-gutters>
            <v-col cols="12" lg="6" class="mb-1">
              <v-icon color="primary" class="mb-1"
                >mdi-information-outline</v-icon
              >
              <div class="infomation_text">
                <div class="mb-2">
                  アチーブメント情報が非公開の場合、
                  <span class="code_text" :style="codeTextColor">
                    マイメニュー > キャラクター管理
                  </span>
                  の
                  <span class="code_text" :style="codeTextColor">
                    公開範囲設定
                  </span>
                  から
                  <span class="font-weight-bold"
                    >アチーブメント情報を「公開」</span
                  >
                  に設定してください。
                </div>
                <div>
                  非公開の場合でも作成自体は可能ですが、現在はアチーブメント情報が取得できること前提で名刺をデザインしております。
                </div>
              </div>
            </v-col>
            <v-col cols="12" lg="6">
              <v-img class="mx-3" src="img/home/1_info_dark.png" contain>
              </v-img>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12">
          <div class="infomation_text">
            <div class="mb-2">
              公式サイトへのアクセス負荷防止のため、一度キャラクターの情報を取得したあとはブラウザごとに情報が保存されます。
            </div>
            <div>
              キャラクターの情報を更新したい場合には上記の手順で再度取得し直してください。
            </div>
          </div>
        </v-col>
      </v-row>
    </v-col>
    <!-- <v-col cols="12">
      <client-only>
        <div v-if="!!responseData" class="text-center">
          {{ responseData }}
        </div>
      </client-only>
    </v-col> -->
  </v-row>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { VImg } from 'vuetify/lib'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import { CharacterInfoStore } from '~/store'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import editCharaSelector from '~/components/characterSelect/editCharaSelector.vue'
  import { headerHeight } from '~/common/const'
  import VueScrollTo from 'vue-scrollto'

  export default Vue.extend({
    components: {
      VImg,
      editCharaSelector,
    },
    data: () => {
      return {
        configKonva: {
          width: 400,
          height: 400,
        },
        configCircle: {
          x: 100,
          y: 100,
          radius: 70,
          fill: 'red',
          stroke: 'black',
          strokeWidth: 4,
        },
        characterSelectorID: 'character-selector',
        configOutputUmage: {},
        howToHeight: 200,
      }
    },
    computed: {
      headerHeight(): number {
        return headerHeight
      },
      charCardStage(): any {
        return this.$refs.charCardStage
      },
      codeTextColor(): Object {
        return this.$vuetify.theme.dark
          ? { background: 'rgba(255, 255, 255, 0.15)' }
          : { background: 'rgba(0, 0, 0, 0.15)' }
      },
    },
    methods: {
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$nuxt.$emit(OUTPUT_SNACKBAR, snackbar)
      },
      selectedFetchedCharacter() {
        CharacterInfoStore.syncAchievements()
        this.$router.push('/selectAchievement')
      },
      clickQuestion() {
        VueScrollTo.scrollTo('#howTo', {
          offset: -headerHeight,
        })
      },
    },
  })
</script>
<style lang="scss" scoped>
  .character_card_name {
    font-size: 28px;
    color: #ccc;
  }
  .character_card_sub {
    font-size: 14px;
    color: #999;
  }
  .container_main {
    padding-top: 64px;
    padding-bottom: 64px;
  }
  .how_to_header {
    font-size: 64px;
  }
  .code_text {
    font-style: italic;
    word-break: break-all;
  }
  .end_how_to {
    margin-bottom: 64px;
  }
  .infomation_text {
    font-size: 14px;
    opacity: 0.8;
  }
</style>
