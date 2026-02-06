<template>
  <v-row no-gutters>
    <v-col cols="12">
      <p v-if="achievementKind.errorMessage">
        {{ achievementKind.errorMessage }}
      </p>
      <client-only>
        <itemsEditor
          v-model="achievementKind"
          @output_snackbar="outputSnackbar($event)"
        />
      </client-only>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
import { KIND } from '@murofush/forfan-common-package/lib/const'
import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'
import rfdc from 'rfdc'
import { AchievementStore } from '~/store'
import itemsEditor from '~/components/itemsEditor.vue'
const clone = rfdc()

export default Vue.extend({
  components: {
    itemsEditor,
  },
  asyncData() {
    const key: keyof typeof KIND = 'pvp'
    return {
      achievementKind: clone(
        AchievementStore.getAchievementDataList.find((list) => {
          return list.key === key
        })
      ),
    }
  },
  methods: {
    outputSnackbar(snackbarInfo: EmitOutputSnackbar) {
      this.$nuxt.$emit(OUTPUT_SNACKBAR, snackbarInfo)
    },
  },
})
</script>
<style lang="scss" scoped></style>
