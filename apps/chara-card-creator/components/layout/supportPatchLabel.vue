<template>
  <span class="app_bar_subtitle">
    対応パッチ: {{ latestPatch ? latestPatch.number : '-' }}
  </span>
</template>
<script lang="ts">
  import { Patch } from '@murofush/forfan-common-package/lib/types'
  import Vue from 'vue'
  import { PatchStore } from '~/store'
  export default Vue.extend({
    computed: {
      latestPatch(): Patch | undefined {
        return PatchStore.getLatestPatch
      },
    },
  })
</script>
<style lang="scss" scoped>
  .app_bar_subtitle {
    font-weight: bold;
    font-size: 12px;
  }
</style>
