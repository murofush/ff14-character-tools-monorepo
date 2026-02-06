import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      innerValWidth: 0,
    }
  },
  props: {
    width: {
      type: Number,
      required: true,
    },
  },
  watch: {
    width() {
      this.innerValWidth = this.width
    },
  },
  mounted() {
    this.innerValWidth = this.width
  },
  methods: {
    setWidth(val: number) {
      this.innerValWidth = val
    },
  },
})
