<template>
  <v-row no-gutters align="center">
    <v-col cols="12"> {{ title }} </v-col>
    <v-col class="mr-2" cols="auto" v-for="(job, index) in value" :key="index">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-row no-gutters align="center" v-bind="attrs" v-on="on">
            <v-col cols="auto">
              <v-img
                :src="getImagePath(job)"
                :width="size"
                :height="size"
              ></v-img
            ></v-col>
            <v-col cols="auto" :style="getJobLevelStyle(job)" class="job_level">
              {{ job.level }}
            </v-col>
          </v-row>
        </template>
        <span>{{ checkClass(job).name }}</span>
      </v-tooltip>
    </v-col>
  </v-row>
</template>
<script lang="ts">
  import Vue, { PropType } from 'vue'
  import { accentColor } from '~/common/const'
  import characterJobsMixin from '~/mixins/characterJobs'
  export default Vue.extend({
    mixins: [characterJobsMixin],
    props: {
      value: {
        type: Array as PropType<JobWithLevel[]>,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        default: 20,
      },
    },
    methods: {
      getJobLevelStyle(job: JobWithLevel): Object {
        return {
          'font-size': `${this.size}px`,
          color: this.getLevelFontColor(job),
        }
      },
      getLevelFontColor(job: JobWithLevel) {
        return (this as any).isLevelMax(job) ? accentColor : 'inherit'
      },
    },
  })
</script>
<style lang="scss" scoped>
  .job_level {
    font-family: 'Roboto Condensed';
    font-weight: bold;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
</style>
