<template>
  <v-row no-gutters>
    <v-col cols="12">
      <v-row no-gutters justify="center">
        <v-col cols="12"> 新規のキャラクターから名刺を作成 </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="url"
            label="loadstone URL"
            :hint="hintLoadstoneCharaPage"
            :error-messages="urlErrors"
            required
            clearable
            @blur="$v.url.$reset()"
            @input="$v.url.$reset()"
          />
        </v-col>
        <v-col cols="12" class="mb-3">
          <v-row no-gutters>
            <v-spacer />
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  @click="clickQuestion"
                  icon
                  v-bind="attrs"
                  v-on="on"
                  class="mr-1"
                >
                  <v-icon>fas fa-question-circle</v-icon>
                </v-btn>
              </template>
              <span>つかいかた</span>
            </v-tooltip>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="loading"
              @click="fetchCharacterInfo"
            >
              取得
            </v-btn>
          </v-row>
        </v-col>
      </v-row>
    </v-col>
    <client-only>
      <v-col v-if="charaData" cols="12">
        <v-row no-gutters>
          <v-col cols="12"> 最新の取得済みのキャラクターから名刺を作成 </v-col>
          <v-col cols="12">
            <v-hover v-slot="{ hover }">
              <v-card outlined :elevation="hover ? 12 : 2" @click="cardClick">
                <v-card-text>
                  <v-row no-gutters>
                    <v-col cols="12" class="mb-3">
                      <v-row no-gutters>
                        <v-col cols="auto" class="character_card_name">
                          {{
                            `${charaData.characterData.firstName}
                ${charaData.characterData.lastName}`
                          }}
                        </v-col>
                        <v-spacer />
                        <v-col cols="auto" class="character_card_sub">
                          最終取得日:
                          {{ dateformat(charaData.fetchedDate) }}
                        </v-col>
                      </v-row>
                    </v-col>
                    <v-col cols="12" class="character_card_sub">
                      {{
                        `${charaData.characterData.datacenter} > ${charaData.characterData.server}`
                      }}
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-overlay v-if="hover" absolute :opacity="0.1" color="#fff" />
              </v-card>
            </v-hover>
          </v-col>
        </v-row>
      </v-col>
    </client-only>
  </v-row>
</template>
<script lang="ts">
  import Vue from 'vue'
  import {
    AchievementKind,
    CompletedAchievement,
    LocalError,
  } from '@murofush/forfan-common-package/lib/types'

  import validationMixin from '~/mixins/validation'
  import { required } from 'vuelidate/lib/validators'
  import dateformat from 'dateformat'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import {
    LOADSTONE_CHARA_PAGE_REGPEX,
    LOADSTONE_CHARACTER_URL,
  } from '~/common/const'
  import {
    AchievementStore,
    CharacterInfoStore,
    SelectedCharaInfoStore,
  } from '~/store'
  import { isLocalError } from '@murofush/forfan-common-package/lib/function'
  import { SCRAPING_ERROR } from '@murofush/forfan-common-package/lib/const'
  import { AxiosError } from 'axios'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'

  export default Vue.extend({
    mixins: [validationMixin],
    data: () => {
      return {
        hintLoadstoneCharaPage:
          'https://jp.finalfantasyxiv.com/lodestone/character/[character-id] のURL、または[character-id]を入力してください。',
        loading: false,
        url: '',
      }
    },
    validations: {
      url: {
        required,
        isLoadstoneCharaPage(url: string) {
          return (
            LOADSTONE_CHARA_PAGE_REGPEX.test(url.split(/\?|#/)[0]) ||
            !isNaN(parseInt(url))
          )
        },
      },
    },
    computed: {
      urlErrors() {
        const errors: string[] = []
        if (!this.$v.url.$dirty) {
          return errors
        }
        !this.$v.url.required && errors.push((this as any).requiredError('URL'))
        !this.$v.url.isLoadstoneCharaPage &&
          errors.push(this.hintLoadstoneCharaPage)
        return errors
      },
      charaData(): ResponseData | null {
        return CharacterInfoStore.getResponseData
      },
      completedAchievements(): AchievementKind<CompletedAchievement>[] {
        return AchievementStore.getAchievementKinds
      },
    },
    methods: {
      async fetchCharacterInfo() {
        this.$v.$touch()
        if (this.$v.$invalid) {
          this.$emit(OUTPUT_SNACKBAR, {
            text: '入力内容に問題があります。',
            color: 'error',
          } as emitOutputSnackbar)
          return
        }
        // Interfaceの役割
        this.loading = true
        let fetchUrl = ''
        if (LOADSTONE_CHARA_PAGE_REGPEX.test(this.url.split(/\?|#/)[0])) {
          fetchUrl =
            this.url.slice(-1) === '/' ? this.url.slice(0, -1) : this.url
        } else if (!isNaN(parseInt(this.url))) {
          fetchUrl = `${LOADSTONE_CHARACTER_URL}/${this.url}`
        } else {
          this.$emit(OUTPUT_SNACKBAR, {
            text: 'INTERNAL_ERROR: 不明なエラーでURLのリクストができませんでした。(INVALID_VALIDATE)',
            color: 'error',
          } as emitOutputSnackbar)
          return
        }
        const responseData = (await this.$axios
          .$get('/api/get_character_info', {
            params: {
              url: fetchUrl,
            },
          })
          .catch((e: AxiosError<LocalError>) => {
            const errorData = e.response?.data
            if (!errorData) {
              const invalidResponseErrorMessage =
                'INTERNAL_ERROR: 不明なエラーが返却されました。'
              console.error(invalidResponseErrorMessage, e)
              this.$emit(OUTPUT_SNACKBAR, {
                text: invalidResponseErrorMessage,
                color: 'error',
              } as emitOutputSnackbar)
              return
            }
            if (isLocalError(errorData)) {
              if (errorData.key === SCRAPING_ERROR.FETCH_LDST_ERROR.key) {
                this.$emit(OUTPUT_SNACKBAR, {
                  text: '入力されたIDからユーザーが見つかりませんでした。',
                  color: 'error',
                } as emitOutputSnackbar)
                return
              } else {
                this.$emit(OUTPUT_SNACKBAR, {
                  text: errorData.value,
                  color: 'error',
                } as emitOutputSnackbar)
                return
              }
            } else {
              console.error('INTERNAL_ERROR: ', errorData)
              this.$emit(OUTPUT_SNACKBAR, {
                text: String(errorData),
                color: 'error',
              } as emitOutputSnackbar)
              return
            }
          })) as ResponseData
        if (responseData) {
          if (
            CharacterInfoStore.getResponseData?.characterID !==
            responseData?.characterID
          ) {
            AchievementStore.resetAchievements()
            SelectedCharaInfoStore.resetSelectedAchievementIndex()
          }
          CharacterInfoStore.setResponseCharacterData(responseData)

          if (CharacterInfoStore.getResponseData) {
            this.$emit('selected', CharacterInfoStore.getResponseData)
          } else {
            this.$emit(
              OUTPUT_SNACKBAR,
              'アチーブメントデータのシンク処理に問題がありました。',
              'error'
            )
          }
        }
        this.loading = false
      },
      async cardClick() {
        this.$emit('selected', CharacterInfoStore.getResponseData)
      },
      dateformat(date: Date | string): string {
        return dateformat(new Date(date), 'yyyy/mm/dd')
      },
      clickQuestion() {
        this.$emit('clickQuestion')
      },
    },
  })
</script>
<style lang="scss" scoped>
  .character_card_name {
    font-size: 28px;
  }
  .character_card_sub {
    font-size: 14px;
  }
</style>
