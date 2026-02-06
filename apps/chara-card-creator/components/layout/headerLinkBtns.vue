<template>
  <v-row dense justify="end">
    <v-col cols="auto" v-for="(item, index) in items" :key="index">
      <v-btn
        nuxt
        text
        class="app_bar_link"
        :to="item.link"
        :disabled="item.disabled ? item.disabled : false"
      >
        <v-icon class="mr-1">{{ item.icon }}</v-icon>
        {{ item.title }}
      </v-btn>
    </v-col>
  </v-row>
</template>
<script lang="ts">
  import Vue, { PropType } from 'vue'
  export default Vue.extend({
    props: {
      items: {
        type: Array as PropType<LinkItem[]>,
        required: true,
      },
    },
  })
</script>
<style lang="scss" scoped></style>
