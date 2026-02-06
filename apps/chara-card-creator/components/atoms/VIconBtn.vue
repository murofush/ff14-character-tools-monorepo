<template>
  <v-btn
    block
    class="icon_button"
    @click="$emit('click')"
    :color="color"
    :small="small"
    :outlined="outlined"
  >
    <v-row no-gutters>
      <v-col cols="12">
        <div class="mb-2">
          <v-icon>{{ icon }}</v-icon>
        </div>
        <div class="button">{{ text }}</div>
      </v-col>
    </v-row>
  </v-btn>
</template>
<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    props: {
      text: {
        type: String,
        default: '',
      },
      icon: {
        type: String,
        default: '',
      },
      color: {
        type: String,
        default: 'secondary',
      },
      textColor: {
        type: String,
        default: '#FFFFFF',
      },
      small: {
        type: Boolean,
        default: false,
      },
      outlined: {
        type: Boolean,
        default: false,
      },
    },
  })
</script>
<style lang="scss" scoped>
  .icon_button {
    height: 100% !important;
    -webkit-transition: all 0.2s;
    -moz-transition: all 0.2s;
    -ms-transition: all 0.2s;
    -o-transition: all 0.2s;
    transition: all 0.2s;
  }
  .button {
  }
</style>
