<template>
  <v-row no-gutters>
    <v-col cols="auto" class="mr-1 mb-1">
      <selected-chara-jobs
        :value="tankWithLevel"
        title="Tank"
        :size="jobIconSize"
      ></selected-chara-jobs>
    </v-col>
    <v-col cols="auto" class="mr-1 mb-1">
      <selected-chara-jobs
        :value="healerWithLevel"
        title="Healer"
        :size="jobIconSize"
      ></selected-chara-jobs>
    </v-col>
    <v-col cols="auto" class="mr-1 mb-1">
      <selected-chara-jobs
        :value="dpsWithLevel"
        title="DPS"
        :size="jobIconSize"
      ></selected-chara-jobs>
    </v-col>
    <v-col cols="auto" class="mr-1 mb-1">
      <selected-chara-jobs
        :value="crafterWithLevel"
        title="Crafter"
        :size="jobIconSize"
      ></selected-chara-jobs>
    </v-col>
    <v-col cols="auto" class="mr-1 mb-2">
      <selected-chara-jobs
        :value="gathererWithLevel"
        title="Gatherer"
        :size="jobIconSize"
      ></selected-chara-jobs>
    </v-col>
  </v-row>
</template>
<script lang="ts">
  import Vue from 'vue'
  import characterJobsMixin from '~/mixins/characterJobs'
  import selectedCharaJobs from '~/components/layout/selectedCharaJobs.vue'
  export default Vue.extend({
    components: { selectedCharaJobs },
    mixins: [characterJobsMixin],
    data() {
      return {
        jobIconSize: 20,
      }
    },
  })
</script>
<style lang="scss" scoped></style>
