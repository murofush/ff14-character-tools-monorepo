<template>
  <v-row no-gutters>
    <v-col cols="12" class="nested-tag-selector">
      <div v-for="el in tags" :key="el.id">
        <v-checkbox
          v-model="selectedTags"
          hide-details
          cols="auto"
          :value="el.id"
          :label="el.name"
          dense
        >
        </v-checkbox>
        <nested-tag-selector
          v-if="el.tags && el.tags.length > 0"
          v-model="selectedTags"
          :tags="el.tags"
        ></nested-tag-selector>
      </div> </v-col
  ></v-row>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import type { Tag } from '@murofush/forfan-common-package/lib/types'

export default Vue.extend({
  name: 'NestedTagSelector',
  props: {
    value: {
      type: Array as PropType<number[]>,
      required: true,
    },
    tags: {
      type: Array as PropType<Tag[]>,
      required: true,
    },
  },
  computed: {
    selectedTags: {
      get(): number[] {
        return (this as any).value
      },
      set(val: number[]) {
        return this.$emit('input', val)
      },
    },
  },
})
</script>
<style lang="scss" scoped>
.nested-tag-selector {
  padding-left: 30px;
}
</style>
