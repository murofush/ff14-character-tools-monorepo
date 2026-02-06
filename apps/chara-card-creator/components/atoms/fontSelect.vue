<template>
  <v-select
    v-model="selectedFont"
    :items="fonts"
    :label="label"
    :clearable="clearable"
    :hideDetails="hideDetails"
    :disabled="disabled"
  >
    <template v-slot:item="{ item }">
      <span :style="{ 'font-family': item }"
        >{{ item }} {{ fontLanguage(item) }}</span
      >
    </template>
    <template v-slot:selection="{ item }">
      <span :style="{ 'font-family': item }"
        >{{ item }} {{ fontLanguage(item) }}</span
      >
    </template>
  </v-select>
</template>
<script lang="ts">
  import Vue, { PropType } from 'vue'
  import { fontEN, fontJP } from '~/common/const'
  import { nonNullable } from '~/common/function'
  export default Vue.extend({
    props: {
      value: {
        type: String,
        default: null,
      },
      items: {
        type: Array as PropType<FontInfo[]>,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      clearable: {
        type: Boolean,
        default: false,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      hideDetails: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      fonts(): string[] {
        return this.items
          .map((font) => {
            if (!font.unselectable) {
              return font.name
            }
          })
          .filter(nonNullable)
      },
      selectedFont: {
        get(): string {
          return this.value
        },
        set(val: string) {
          this.$emit('input', val)
        },
      },
    },
    methods: {
      fontLanguage(font: string): string {
        const findFontJP = fontJP.find((fontJP) => {
          return fontJP.name === font
        })
        if (findFontJP) return '(JP)'
        const findFontEN = fontEN.find((fontEN) => {
          return fontEN.name === font
        })
        if (findFontEN) return '(EN)'
        return ''
      },
    },
  })
</script>
<style lang="scss" scoped></style>
