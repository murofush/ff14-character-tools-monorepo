<template>
  <v-row no-gutters>
    <v-col
      cols="12"
      md="8"
      v-resize="onResize"
      class="canvas_container"
      :style="smStickyStyle"
    >
      <v-card
        tile
        :style="mdStickyStyle"
        elevation="6"
        :class="{ 'ma-4': !isMobileSize }"
      >
        <chara-card-canvas
          ref="charaCardCanvas"
          :descriptionRows="descriptionRows"
          :max-height-px="getMaxCanvasHeight()"
          @output_snackbar="showSnackbar"
        ></chara-card-canvas>
      </v-card>
    </v-col>
    <v-col cols="12" md="4" class="setting_container">
      <v-card outlined tile>
        <v-card-text>
          <chara-card-settings
            :descriptionRows="descriptionRows"
            @save="saveCharaCard"
            @output_snackbar="showSnackbar"
            @updateCanvas="updateCanvas"
          ></chara-card-settings>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import Vue from 'vue'
  import { headerHeight } from '~/common/const'
  import CharaCardCanvas from '~/components/characterCard/charaCardCanvas.vue'
  import CharaCardSettings from '~/components/characterCard/charaCardSettings.vue'

  const stickyStyle: { [key: string]: any } = {
    position: ['sticky', '-webkit-sticky'],
    'z-index': 12,
  }
  export default Vue.extend({
    components: {
      CharaCardCanvas,
      CharaCardSettings,
    },
    data() {
      return {
        windowSize: {
          x: 0,
          y: 0,
        } as Position,
        descriptionRows: 3,
      }
    },
    mounted() {
      this.onResize()
    },
    computed: {
      isMobileSize(): boolean {
        return this.$vuetify.breakpoint.smAndDown
      },
      windowContainerHeight(): number {
        return this.windowSize ? this.windowSize.y - headerHeight : 0
      },
      smStickyStyle(): Object {
        if (this.isMobileSize) {
          return Object.assign(stickyStyle, {
            top: `${headerHeight}px`,
            transform: 'translateY(0%)',
          })
        }
        return {}
      },
      mdStickyStyle(): Object {
        if (!this.isMobileSize) {
          return Object.assign(stickyStyle, {
            top: `50%`,
            transform: 'translateY(-50%)',
          })
        }
        return {
          transform: 'translateY(0%)',
        }
      },
    },
    methods: {
      onResize() {
        this.windowSize = { x: window.innerWidth, y: window.innerHeight }
      },
      getMaxCanvasHeight(): number {
        if (this.isMobileSize) {
          return this.windowSize.y / 3
        }
        return this.windowContainerHeight
      },
      updateCanvas() {
        const charaCardRef = this.$refs.charaCardCanvas as any
        if (charaCardRef) {
          charaCardRef.updateCanvas()
        }
      },
      saveCharaCard() {
        const charaCardRef = this.$refs.charaCardCanvas as any
        if (charaCardRef) {
          charaCardRef.saveImage()
        }
      },
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$emit(OUTPUT_SNACKBAR, snackbar)
      },
    },
  })
</script>
<style lang="scss" scoped>
  .canvas_container {
    height: auto;
  }
  .setting_container {
    margin-bottom: 300px;
  }
</style>
