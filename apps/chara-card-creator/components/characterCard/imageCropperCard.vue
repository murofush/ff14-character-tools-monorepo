<template>
  <v-card v-resize="onResize" class="preview_card pa-2">
    <v-row no-gutters>
      <v-col cols="12" md="9">
        <image-cropper
          ref="imageCropper"
          v-model="uploadedImage"
          :crop-ratio="cropRatio"
          :max-height-px="getCropperHeight()"
        ></image-cropper>
      </v-col>
      <v-col cols="12" md="3">
        <v-card flat class="pl-2 py-2 window_height_100">
          <v-row no-gutters class="window_height_100">
            <v-col cols="12">
              <v-row no-gutters>
                <v-col cols="12" class="mb-2">
                  <v-row no-gutters justify="end">
                    <v-col cols="auto">
                      <v-btn
                        :disabled="!imageUploaded"
                        dark
                        color="error"
                        @click="closeCropperDialog"
                        >キャンセル
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
                <v-col cols="12">
                  <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        block
                        color="secondary"
                        :disabled="!imageUploaded"
                        class="mb-2 mr-2"
                        @click="fullsizeTransformer"
                        v-bind="attrs"
                        v-on="on"
                        >全体を選択
                      </v-btn>
                    </template>
                    <span>設定された画面比率で画像全体幅を選択します。</span>
                  </v-tooltip>
                </v-col>
                <v-col cols="12">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        block
                        color="secondary"
                        class="mb-2 mr-2"
                        :disabled="!imageUploaded"
                        @click="resetTransformer"
                        v-bind="attrs"
                        v-on="on"
                      >
                        リセット
                      </v-btn>
                    </template>
                    <span
                      >トリミング範囲、画像をリセットします。
                      トリミング画像の表示が崩れてる場合はリセットを試してください。
                    </span>
                  </v-tooltip>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" class="mt-auto">
              <v-row no-gutters>
                <v-col cols="12">
                  <v-btn block large color="primary" @click="getCroppedImage"
                    >適用</v-btn
                  >
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>
<script lang="ts">
  import {
    CropRatio,
    EmitImageUpload,
  } from '@murofush/forfan-common-vue/lib/types'
  import Vue, { PropType } from 'vue'
  import cropperjs from 'cropperjs'
  import { CROP_RATIO_LIST } from '@murofush/forfan-common-vue/lib/const/imageCropper'
  import { OUTPUT_SNACKBAR } from '@murofush/forfan-common-vue/lib/const'

  const resetableCropData = () => {
    return {
      width: 0,
      height: 0,
      rotate: 0,
      scaleX: 0,
      scaleY: 0,
    } as cropperjs.Data
  }

  export default Vue.extend({
    data() {
      return {
        windowSize: {
          x: 0,
          y: 0,
        } as Position,
        cropData: resetableCropData(),
      }
    },
    props: {
      uploadedImage: {
        type: Object as PropType<EmitImageUpload>,
        default: null,
      },
      cropRatio: {
        type: Object as PropType<CropRatio>,
        default: CROP_RATIO_LIST.nineSixteen,
      },
    },
    computed: {
      imageUploaded(): boolean {
        return !!this.uploadedImage && this.uploadedImage.image !== null
      },
    },
    methods: {
      mounted() {
        this.onResize()
      },
      getCropperHeight() {
        if (this.$vuetify.breakpoint.mdAndUp) {
          return this.windowSize.y * 0.8
        } else {
          return this.windowSize.y * 0.65
        }
      },
      onResize() {
        if (window) {
          this.windowSize = { x: window.innerWidth, y: window.innerHeight }
        }
      },
      resetTransformer() {
        ;(this.$refs.imageCropper as any).resetTransformer()
      },
      fullsizeTransformer() {
        ;(this.$refs.imageCropper as any).fullsizeTransformer()
      },
      isImageCropped(): boolean {
        // cropWidth, cropHeightを「０」で計算した際にエラーが発生することがあった。
        return (
          !!this.uploadedImage &&
          !!this.uploadedImage.image &&
          this.cropData.width > 1 &&
          this.cropData.height > 1
        )
      },
      updateCropInfo(customEvent: cropperjs.CropEvent) {
        this.cropData = customEvent.detail
      },
      getCroppedImage() {
        const url = (this.$refs.imageCropper as any).getCroppedCanvas()
        if (url) {
          const image = new Image()
          image.src = url
          // const app = this
          image.onload = () => {
            this.$emit('cropped', image)
            this.$emit('update:uploadedImage', null)
          }
          image.onerror = (err) => {
            this.$emit(OUTPUT_SNACKBAR, {
              text: `画像の取得に失敗しました。 err: ${err}`,
              color: 'error',
            })
          }
        } else {
          this.$emit(OUTPUT_SNACKBAR, {
            text: `INTERNAL_ERROR: 画像データの取得に失敗しました。`,
            color: 'error',
          })
        }
      },
      closeCropperDialog() {
        this.cropData = resetableCropData()
        this.$emit('update:uploadedImage', null)
      },
    },
  })
</script>
<style lang="scss" scoped>
  .window_height_100 {
    height: 100%;
  }
</style>
