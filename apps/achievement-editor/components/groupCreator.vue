<template>
  <v-row no-gutters class="text-left">
    <v-col cols="12">
      <label class="caption">分類グループ作成</label>
    </v-col>
    <v-col cols="8">
      <v-text-field
        v-model="title"
        class="mr-3"
        :error-messages="titleErrors"
        label="カテゴリー名"
      ></v-text-field>
    </v-col>
    <v-col cols="auto">
      <v-btn @click="onClicked">追加</v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
import { required } from 'vuelidate/lib/validators'
import validationMixin from '~/mixins/validation'

export default Vue.extend({
  mixins: [validationMixin],
  data() {
    return {
      title: '',
    }
  },
  validations: {
    title: {
      required,
    },
  },
  computed: {
    titleErrors() {
      const errors: string[] = []
      if (!this.$v.title.$dirty) return errors
      !this.$v.title.required &&
        errors.push((this as any).requiredError('タイトル'))
      return errors
    },
  },
  methods: {
    onClicked() {
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }
      const response: EmitGroupCreator = { title: this.title }
      this.$emit('groupCreate', response)
      this.$v.$reset()
      this.title = ''
    },
  },
})
</script>

<style lang="scss" scoped></style>
