<template>
  <edit-chara-card @output_snackbar="showSnackbar"></edit-chara-card>
</template>
<script lang="ts">
  import editCharaCard from '~/components/characterCard/editCharaCard.vue'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
  import { emitOutputSnackbar } from '@murofush/forfan-common-vue/lib/types'
  import Vue from 'vue'
  export default Vue.extend({
    middleware: 'checkSelectedMiddleware',
    components: {
      editCharaCard,
    },
    methods: {
      showSnackbar(snackbar: emitOutputSnackbar) {
        this.$nuxt.$emit(OUTPUT_SNACKBAR, snackbar)
      },
    },
  })
</script>
<style lang="scss" scoped></style>
