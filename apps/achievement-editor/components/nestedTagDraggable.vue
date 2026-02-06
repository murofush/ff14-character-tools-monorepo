<template>
  <draggable
    class="dragArea"
    tag="div"
    :list="tags"
    :group="{ name: 'tag' }"
    :style="{ background: `rgb(${colorVal},${colorVal},${colorVal})` }"
    @change="sortTag()"
  >
    <div v-for="(tag, index) in tags" :key="tag.id">
      <h3 :style="{ color: getHeaderColor() }">
        <image-icon
          :icon-path="tag.iconPath"
          :image-size="tagImageSize"
          :rounded="!tag.flatIcon"
        ></image-icon>
        {{ tag.id }}. {{ tag.name }}
        <v-btn icon class="ml-3" @click="deleteTag(index)">
          <v-icon>fas fa-trash</v-icon>
        </v-btn>
      </h3>
      <nested-tag-draggable
        v-show="(tags[index].tags && tags[index].tags.length > 0) || insertable"
        :index="index"
        :tags="tags[index].tags"
        :insertable="insertable"
        :color-val="colorVal + 12"
        @delete="deleteNestedTag"
      />
    </div>
  </draggable>
</template>
<script lang="ts">
import { Tag } from '@murofush/forfan-common-package/lib/types'
import Vue, { PropType } from 'vue'
import draggable from 'vuedraggable'
export default Vue.extend({
  name: 'NestedTagDraggable',
  components: {
    draggable,
  },
  data() {
    return {
      tagImageSize: 30,
    }
  },
  props: {
    index: {
      required: true,
      type: Number,
    },
    tags: {
      required: true,
      type: Array as PropType<Tag[]>,
    },
    colorVal: {
      required: true,
      type: Number,
    },
    insertable: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    getHeaderColor() {
      if (this.colorVal > 128) {
        return '#000'
      } else {
        return '#fff'
      }
    },
    deleteNestedTag(tagIndexStack: number[]) {
      tagIndexStack.push(this.index)
      this.$emit('delete', tagIndexStack)
    },
    deleteTag(tagIndex: number) {
      this.$emit('delete', [tagIndex, this.index])
    },
    sortTag() {
      this.tags.sort((a, b) => {
        const aIndex = a.id ? a.id : -1
        const bIndex = b.id ? b.id : -1
        return aIndex - bIndex
      })
    },
  },
})
</script>
<style lang="scss" scoped>
.dragArea {
  min-height: 40px;
  padding-left: 30px;
  outline: 1px solid #999;
}
</style>
