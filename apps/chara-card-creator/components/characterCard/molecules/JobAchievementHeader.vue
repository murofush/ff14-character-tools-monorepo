<template>
  <v-group ref="headerGroup">
    <v-async-image
      ref="headerImage"
      :src="iconSrc"
      :config="configHeader"
    ></v-async-image>
    <v-text ref="headerTitile" :config="configHeaderTitle"></v-text>
    <v-line :config="configHeaderLine"></v-line>
  </v-group>
</template>
<script lang="ts">
  import Vue from 'vue'
  import Konva from 'Konva'
  import VAsyncImage from '~/components/characterCard/molecules/VAsyncImage.vue'
  import { secondaryOpacity, themeColor } from '~/common/const'
  import { FORFAN_RESOURCES_URL } from '@murofush/forfan-common-package/lib/const'
  import { SelectedCharaInfoStore } from '~/store'
  export default Vue.extend({
    components: { VAsyncImage },
    props: {
      iconName: {
        type: String,
        required: true,
      },
      headerHeight: {
        type: Number,
        required: true,
      },
      width: {
        type: Number,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    },
    watch: {},
    computed: {
      cardColor(): CardColor {
        return SelectedCharaInfoStore.getCardColor
      },
      infoTextBold(): string {
        return SelectedCharaInfoStore.getInfoTextBold ? 'bold' : ''
      },
      lineStrokeSize(): number {
        return SelectedCharaInfoStore.getInfoTextBold ? 2 : 1
      },
      charaInfoFontFamily(): string {
        return SelectedCharaInfoStore.getCharaInfoFontFamily
      },
      theme(): Theme {
        return SelectedCharaInfoStore.getTheme
      },
      iconSrc(): string {
        return `${FORFAN_RESOURCES_URL}/img/${this.iconName}_${this.theme}.png`
      },
      themeKeys(): string[] {
        return Object.keys(themeColor)
      },
      iconSize(): number {
        return this.headerHeight
      },
      fontSize(): number {
        return (this.headerHeight * 4) / 5
      },
      margin(): number {
        return this.headerHeight / 5
      },
      configHeaderLine(): Konva.LineConfig {
        return {
          x: this.iconSize,
          y: this.fontSize + this.margin,
          points: [0, 0, this.width - this.iconSize * 2, 0],
          stroke: this.cardColor.textColor,
          opacity: secondaryOpacity,
          fontStyle: this.infoTextBold,
          strokeWidth: this.lineStrokeSize,
        }
      },
      configHeaderTitle(): Konva.TextConfig {
        return {
          text: this.text,
          x: this.iconSize + this.margin,
          fontFamily: this.charaInfoFontFamily,
          fontStyle: this.infoTextBold,
          fontSize: this.fontSize,
          height: this.iconSize,
          fill: this.cardColor.textColor,
          verticalAlign: 'middle',
        }
      },
      configHeader(): Konva.NodeConfig {
        return {
          image: undefined,
          width: this.iconSize,
          height: this.iconSize,
        }
      },
    },
    methods: {
      getHeaderGroup(): Konva.Group | undefined {
        return (this.$refs.headerGroup as any)?.getNode() as Konva.Group
      },
      getHeaderImage(): Konva.Group | undefined {
        return (this.$refs.headerImage as any)?.getNode() as Konva.Group
      },
      getHeaderTitle(): Konva.Text | undefined {
        return (this.$refs.headerTitile as any)?.getNode() as Konva.Text
      },
      updateCanvas() {
        this.getHeaderTitle()?.setAttrs(this.configHeaderTitle)
      },
    },
  })
</script>
<style lang="scss" scoped></style>
