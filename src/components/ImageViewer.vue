<script setup lang="ts">
import type { Directive } from 'vue'
import type { TouchPanValue } from 'quasar'
import type { HTMLEventManage } from '@/utils/event'

const props = defineProps<{ src: string }>()
const eventList = [] as HTMLEventManage<any>[]

const imagePosition = reactive({
    scale: 1, // 缩放倍数
    top: 0,
    left: 0,
    deg: 0, // 旋转角度
    size: '', // 图片短边长度
})

const touchStore = {
    pageX: 0,
    pageY: 0,
    pageX2: 0,
    pageY2: 0,
    resizeable: false,
    draggable: true,
}

// 图片蒙层样式
const maskStyle = computed(() => {
    return `top:${imagePosition.top}px;left:${imagePosition.left}px`
})

// 缩放
const picResize = (resize: number) => {
    imagePosition.scale += resize
    if (imagePosition.scale > 5) {
        imagePosition.scale = 5
    }
    if (imagePosition.scale < 0.3) {
        imagePosition.scale = 0.3
    }
}

// 图片样式
const imageStyle = computed(() => {
    return `transform:scale(${imagePosition.scale}) rotate(${imagePosition.deg}deg);${imagePosition.size}`
})

function resizeOnscroll(e: WheelEvent) {
    e.preventDefault()
    picResize(-e.deltaY / 400)

    return false
}

// 拖动
const dragMove: TouchPanValue = function(details) {
    if (touchStore.draggable) {
        imagePosition.top += details!.delta!.y!
        imagePosition.left += details!.delta!.x!
    }
}

// 重置
const sizeReset = () => {
    imagePosition.deg = 0
    imagePosition.top = 0
    imagePosition.left = 0
    imagePosition.scale = 1
}

const vTakeSize: Directive = {
    mounted(img: HTMLImageElement) {
        const parent = img.parentElement
        const { width, height } = getComputedStyle(parent!)
        const container_width = Number.parseFloat(width)
        const container_height = Number.parseFloat(height)
        const radio = container_width / container_height
       
        img.onload = () => {
            const { naturalWidth, naturalHeight } = img
            const img_radio = naturalWidth / naturalHeight
            if (naturalHeight < container_height && naturalWidth < container_width) {
                imagePosition.size = `width:${naturalWidth}px;height:${naturalHeight}px`
            } else if (img_radio > radio) {
                imagePosition.size = 'width:100%'
            } else {
                imagePosition.size = 'height:100%'
            }
            
        }
    },
}

watch(() => props.src, () => {
    sizeReset()
})

onBeforeUnmount(() => {
    for (const eventItem of eventList) {
        eventItem.removeEventListener()
    }
})
</script>

<template>
  <div 
    pst="abs inset-0"
    style="width: 100%; height: calc(100% - 65px);"
    overflow-hidden
  >
    <div
      :style="maskStyle"
      class="image"
      @mousewheel="resizeOnscroll"
    >
      <img
        v-touch-pan.prevent.mouse="dragMove"
        v-take-size
        :src="src"
        :alt="src"
        :style="imageStyle"
        draggable="false"
        crossorigin="anonymous"
      >
    </div>
  </div>
</template>

<style lang="scss">
.image {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;

    img {
      cursor: grab;
      -webkit-user-drag: none;
      object-fit: contain;

      &:active {
        cursor: grabbing;
      }
    }
  }
</style>
