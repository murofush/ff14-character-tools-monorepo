<template>
  <v-row no-gutters>
    <v-col cols="12">
      <v-expansion-panels v-model="tagGroupPanels" multiple accordion>
        <v-row no-gutters>
          <v-col v-for="el in tags" :key="el.id" cols="12" sm="6">
            <v-expansion-panel>
              <v-expansion-panel-header>
                <v-row>
                  <v-col cols="auto">
                    <v-checkbox
                      v-model="selectedTags"
                      hide-details
                      cols="auto"
                      :value="el.id"
                      :label="el.name"
                      dense
                      @click.stop
                    >
                    </v-checkbox>
                  </v-col>
                </v-row>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <nested-tag-selector
                  v-model="selectedTags"
                  :tags="el.tags"
                ></nested-tag-selector>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-col>
        </v-row>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import rfdc from 'rfdc'
import { TagStore } from '~/store'

const clone = rfdc()

export default Vue.extend({
  props: {
    value: {
      type: Array as PropType<number[]>,
      required: true,
    },
  },
  data() {
    return {
      tagGroupPanels: [] as number[],
      tags: clone(TagStore.getTags),
    }
  },
  computed: {
    selectedTags: {
      get(): number[] {
        return this.value
      },
      set(val: number[]) {
        const sortedTagIds = val.sort((a, b) => {
          return a - b
        })
        this.$emit('input', sortedTagIds)
      },
    },
  },
  mounted() {
    // 常に開いてる状態にしたい場合にはここをアンコメントする
    // this.tagGroupPanels = Array.isArray(this.tags)
    //   ? [...Array(this.tags.length)].map((_, i) => i)
    //   : []
  },
  methods: {},
})
</script>
<style lang="scss" scoped></style>
