<template>
  <v-row dense class="mx-3">
    <v-col cols="auto">
      <image-icon
        :icon-path="itemData.itemAwardImagePath"
        :icon-url="itemData.itemAwardImageUrl"
        :imageSize="imageSize"
      ></image-icon>
    </v-col>
    <v-col class="align-self-center">
      <span class="subtitle-1">{{ itemData.itemAward }} </span>
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
      imageSize: {
        type: Number,
        default: 40,
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
    methods: {},
  })
</script>
<style lang="scss" scoped></style>
