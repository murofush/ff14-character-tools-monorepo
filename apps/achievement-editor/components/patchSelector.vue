<template>
  <v-row no-gutters>
    <v-col cols="12">
      <v-btn @click="selectedPatches = 0">未選択</v-btn>
    </v-col>
    <v-col v-for="el in patches" :key="el.id" cols="12" sm="6">
      <v-radio-group v-model="selectedPatches">
        <v-radio
          hide-details
          cols="auto"
          :value="el.id"
          :label="`${el.number} - ${el.subtitle}`"
          dense
          @click.stop
        >
        </v-radio>
      </v-radio-group>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue from 'vue'
import rfdc from 'rfdc'
import { PatchStore } from '~/store'

const clone = rfdc()

export default Vue.extend({
  props: {
    value: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      patches: clone(PatchStore.getPatches),
    }
  },
  computed: {
    selectedPatches: {
      get(): number {
        return this.value
      },
      set(val: number) {
        this.$emit('input', val)
      },
    },
  },
})
</script>
<style lang="scss" scoped></style>
