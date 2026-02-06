<template>
  <v-row no-gutters>
    <v-col cols="12" :style="disabledOpacityStyle">
      <span>{{ title }}</span>
      <v-hover>
        <template v-slot:default="{ hover }">
          <v-card @click="cardClick">
            <v-fade-transition>
              <v-overlay v-if="hover" absolute color="select" :opacity="0.2">
              </v-overlay>
            </v-fade-transition>
            <v-img :height="height" v-if="src" contain :src="src"></v-img>
            <v-card :height="height" v-else plain block>
              <v-card-text class="no_selected_card pa-0">
                <v-row
                  no-gutters
                  class="no_selected_card"
                  align="center"
                  justify="center"
                >
                  <v-col cols="12" align-self="center">
                    <v-row no-gutters align="center" justify="center">
                      <v-col class="mb-2" cols="auto">
                        <v-icon class="mr-1">fas fa-image</v-icon>
                        <v-icon>fas fa-question</v-icon>
                      </v-col>
                      <v-col cols="12" class="text-center">
                        <span class="font-weight-bold">
                          アップロードされていません
                        </span>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
        </template>
      </v-hover>
    </v-col>
  </v-row>
</template>
<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    props: {
      src: {
        type: String,
        default: null,
      },
      title: {
        type: String,
        default: '',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      height: {
        type: Number,
        default: 200,
      },
    },
    computed: {
      disabledOpacityStyle() {
        return this.disabled ? { opacity: 0.5 } : {}
      },
    },
    methods: {
      cardClick() {
        this.$emit('click')
      },
    },
  })
</script>
<style lang="scss" scoped>
  .no_selected_card {
    height: 100%;
  }
</style>
