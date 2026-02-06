<template>
  <v-list dense nav class="overflow-y-scroll" :style="containerStyle">
    <v-list-item-group v-if="isSynced && group">
      <v-list-item
        class="clickable"
        inactive
        nuxt
        v-scroll-to="{
          el: `#${getGroupElementId(groupIndex)}`,
          offset: -topHeightSpace,
        }"
        @click="$emit('click')"
        v-for="(groupItem, groupIndex) in group"
        :key="groupIndex"
        link
      >
        <v-list-item-content>
          <v-list-item-title>{{ groupItem.title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>
<script lang="ts">
  import Vue from 'vue'
  import achievementMixin from '~/mixins/achievement'
  export default Vue.extend({
    props: {
      containerStyle: {
        type: Object,
        default: () => {
          return {}
        },
      },
    },
    mixins: [achievementMixin],
  })
</script>
<style lang="scss" scoped></style>
