<template>
  <v-menu
    open-on-hover
    :close-on-content-click="false"
    :nudge-width="200"
    offset-y
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        class="app_bar_charaname text-capitalize"
        :text="$vuetify.breakpoint.mdAndUp"
        :icon="$vuetify.breakpoint.smAndDown"
        :ripple="false"
        v-bind="attrs"
        v-on="on"
      >
        <span v-show="$vuetify.breakpoint.mdAndUp">
          {{ selectedCharacterName }}
        </span>
        <span v-show="$vuetify.breakpoint.smAndDown">
          <v-icon> fas fa-user</v-icon>
        </span>
      </v-btn>
    </template>

    <client-only>
      <v-card max-width="600">
        <v-card-text>
          <v-row no-gutters align="center">
            <v-col cols="12" :style="infoTextStyle">
              {{ characterBiologyInfo }}
            </v-col>
            <v-col cols="12" class="mb-3">
              <a
                class="text-h4 text--primary title_link"
                :href="selectedCharaLoadstoneUrl"
                target="_blank"
              >
                {{ selectedCharacterName }}
              </a>
            </v-col>
            <v-col cols="12" class="mb-3">
              <v-row no-gutters>
                <v-col cols="auto" class="mb-1">
                  <v-row no-gutters align="center">
                    <v-col
                      class="mr-1"
                      :style="fcCrestContainerStyle"
                      cols="auto"
                    >
                      <v-img
                        class="fc_crest_image"
                        :src="fcImages"
                        contain
                        :height="infoFontSize * 2"
                        :width="infoFontSize * 2"
                        :key="index"
                        v-for="(fcImages, index) in fcCrestImages"
                      ></v-img>
                    </v-col>
                    <v-col>
                      <v-row no-gutters :style="infoTextStyle">
                        <v-col cols="12">
                          {{ freecompanyInfo.fcName
                          }}{{ freecompanyInfo.fcTag }}
                        </v-col>
                        <v-col cols="12">
                          <v-row no-gutters align="center">
                            <v-col cols="auto">
                              <v-img
                                :src="freecompanyInfo.positionBaseImageUrl"
                                :width="infoFontSize"
                                :height="infoFontSize"
                              ></v-img>
                            </v-col>
                            <v-col cols="auto">
                              {{ freecompanyInfo.positionName }}
                            </v-col>
                          </v-row>
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="auto" class="mb-1">
                  <v-row no-gutters>
                    <v-col cols="auto" align-self="center">
                      <v-img
                        :src="serverIcon"
                        :width="infoFontSize * 2"
                        :height="infoFontSize * 2"
                      ></v-img>
                    </v-col>
                    <v-col>
                      <v-row no-gutters :style="infoTextStyle">
                        <v-col cols="12">
                          {{ selectedCharacter.datacenter }}
                        </v-col>
                        <v-col cols="12">
                          {{ selectedCharacter.server }}
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" class="mb-3">
              <v-divider></v-divider>
            </v-col>
            <v-col cols="12">
              <selected-chara-job-list></selected-chara-job-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </client-only>
  </v-menu>
</template>
<script lang="ts">
  import Vue from 'vue'
  import { LOADSTONE_CHARACTER_URL } from '~/common/const'
  import { CharacterInfoStore } from '~/store'
  import selectedCharaJobList from '~/components/layout/selectedCharaJobList.vue'
  import { FORFAN_RESOURCES_URL } from '@murofush/forfan-common-package/lib/const'
  export default Vue.extend({
    components: {
      selectedCharaJobList,
    },
    data() {
      return {
        infoFontSize: 16,
      }
    },
    computed: {
      serverIcon(): string {
        return `${FORFAN_RESOURCES_URL}/img/server.svg`
      },
      responseData(): ResponseData | null {
        return CharacterInfoStore.getResponseData
      },
      selectedCharacter(): CharacterInfo | null {
        return this.responseData?.characterData ?? null
      },
      selectedCharacterName(): string {
        return this.selectedCharacter
          ? `${this.selectedCharacter.firstName} ${this.selectedCharacter.lastName}`
          : ''
      },
      characterBiologyInfo(): string {
        return this.selectedCharacter
          ? `${this.selectedCharacter.race}/${this.selectedCharacter.clan}/${this.selectedCharacter.gender}`
          : ''
      },
      selectedCharaLoadstoneUrl(): string {
        const characterID = this.responseData?.characterID
        return characterID ? `${LOADSTONE_CHARACTER_URL}/${characterID}` : ''
      },
      freecompanyInfo(): (FreecompanyPositionInfo & FreecompanyInfo) | null {
        return this.responseData?.freecompanyInfo ?? null
      },
      fcCrestImages(): string[] {
        return this.freecompanyInfo?.fcCrestBaseImageUrls ?? []
      },
      fcCrestContainerStyle(): Object {
        return {
          height: `${this.infoFontSize * 2}px`,
          width: `${this.infoFontSize * 2}px`,
        }
      },
      infoTextStyle(): Object {
        return {
          'font-size': `${this.infoFontSize}px`,
          'line-height': '1rem',
        }
      },
    },
  })
</script>
<style lang="scss" scoped>
  .decoration_none {
    text-decoration: none;
  }
  .title_link {
    text-decoration: none;
    color: inherit;
  }
  .fc_crest_image {
    position: absolute;
  }
  .inline_block_img {
    vertical-align: text-top;
  }
  .app_bar_charaname {
    font-size: 16px;
  }
</style>
