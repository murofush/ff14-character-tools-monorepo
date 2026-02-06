<template>
  <v-row class="ma-3">
    <v-col cols="auto">
      <v-avatar tile>
        <v-img :aspect-ratio="1" :src="loadingImg()"></v-img>
      </v-avatar>
    </v-col>
    <v-col cols="auto" class="align-self-center">
      <label>{{ itemData.itemAward }}</label
      ><br />
      <label> {{ itemData.itemAwardImagePath }}</label>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { FetchedItemData } from '@murofush/forfan-common-package/lib/types'
import Vue, { PropType } from 'vue'
import { ImgMixin } from '@murofush/forfan-common-vue'
export default Vue.extend({
  mixins: [ImgMixin],
  props: {
    value: {
      type: Object as PropType<FetchedItemData>,
      default: null,
      required: true,
    },
    loadLocalImg: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    itemData: {
      get(): FetchedItemData {
        return this.value
      },
      set(val: FetchedItemData) {
        this.$emit('input', val)
      },
    },
  },
  methods: {
    loadingImg() {
      if (this.loadLocalImg) {
        return (this as any).getIconFromUrl(this.itemData.itemAwardImagePath)
      } else {
        return this.itemData.itemAwardImageUrl
      }
    },
  },
})
</script>
<style lang="sass" scoped></style>
