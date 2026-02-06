import Vue from 'vue'
import { validationMixin as vuelidateMixin } from 'vuelidate'
/**
 * TODO: Mixinからメソッドの呼び出し時にthisで参照できない問題の解決
 */
export default Vue.extend({
  mixins: [vuelidateMixin],
  methods: {
    requiredError(key: string) {
      return `${key}は必須です。`
    },
    loadstoneError(key: string) {
      return `${key}にloadStoneのURLを入力してください。`
    },
  },
})
