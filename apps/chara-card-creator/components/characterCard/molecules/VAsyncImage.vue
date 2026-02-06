<template>
  <v-group ref="group"></v-group>
</template>
<script lang="ts">
  import Vue, { PropType } from 'vue'
  import Konva from 'konva'
  import { ImgMixin } from '@murofush/forfan-common-vue'
  export default Vue.extend({
    mixins: [ImgMixin],
    props: {
      src: {
        type: String,
        required: true,
      },
      config: {
        type: Object as PropType<Konva.NodeConfig>,
        default: { image: undefined },
      },
    },
    async mounted() {
      await this.loadImage()
    },
    watch: {
      src() {
        this.loadImage()
      },
    },
    methods: {
      getNode(): Konva.Group | undefined {
        return (this.$refs.group as any)?.getNode() as Konva.Group
      },
      async loadImage() {
        if (this.src) {
          Konva.Image.fromURL(this.src, (image: Konva.Image) => {
            const tempImage = image.image()
            image.setAttrs(this.config)
            image.image(tempImage)
            this.getNode()?.add(image)
            this.getNode()?.getLayer()?.batchDraw()
          })
        }
      },
    },
  })
</script>
