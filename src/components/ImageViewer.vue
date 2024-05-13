<script setup lang="ts">
import type { Directive } from 'vue'
import type { TouchPanValue } from 'quasar'
import type { HTMLEventManage } from '@/utils/event'
import { useElementRef } from '@/composables/useComp'

const props = defineProps<{ src: string }>()
const eventList = [] as HTMLEventManage<any>[]
const image_size = reactive({ width: 0, height: 0 })

// const show_controller = ref(false)
const controller = useElementRef<HTMLDivElement>()

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
    picResize(-e.deltaY / 1000)

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

const vTakeSize: Directive = (img: HTMLImageElement) => {
    const parent = img.parentElement
    const { width, height } = getComputedStyle(parent!)
    const container_width = Number.parseFloat(width)
    const container_height = Number.parseFloat(height)
    const radio = container_width / container_height

    img.onload = () => {
        const { naturalWidth, naturalHeight } = img
        image_size.width = naturalWidth
        image_size.height = naturalHeight
        const img_radio = naturalWidth / naturalHeight
        if (naturalHeight < container_height && naturalWidth < container_width) {
            imagePosition.size = `width:${naturalWidth}px;height:${naturalHeight}px`
        } else if (img_radio > radio) {
            imagePosition.size = 'width:100%'
        } else {
            imagePosition.size = 'height:100%'
        }

    }
}

const mouse_moving = ref(false)
let mouse_is_down = false
let timer = 0
function show_controller() {
    if (mouse_moving.value) {
        clearTimeout(timer)
    } else {
        mouse_moving.value = true
    }
    timer = window.setTimeout(() => {
        if (!mouse_is_down) {
            mouse_moving.value = false
        }
    }, 1500)
}
function mouse_move() {
    mouse_is_down = false
    show_controller()
}
function mouse_pan(state: 'end' | 'start') {
    mouse_is_down = state === 'start'
    if (!mouse_is_down) {
        show_controller()
    }
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
    class="mask"
    @mousemove="mouse_move"
  >
    <div
      v-show="mouse_moving"
      class="image-size"
    >
      图片尺寸： {{ image_size.width }} * {{ image_size.height }}
    </div>
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
    <div
      v-show="mouse_moving"
      ref="controller"
      class="image-controller"
    >
      <q-slider
        v-model="imagePosition.scale"
        class="scale-slider"
        :step="0.1"
        :min="0.3"
        :max="5"
        color="fg"
        @pan="mouse_pan"
      />
      <div
        class="i-ic:sharp-restart-alt"
        h="30"
        w="30"
        m="l-20"
        op="80 hover:100"
        cursor-pointer
        @click="sizeReset"
      />
    </div>
  </div>
</template>

<style lang="scss">
.image-size {
    position: absolute;
    top: 0;
    right: 0;
    color: var(--eb-fg);
    font-size: 12px;
    padding: 5px 10px;
    background-color: var(--eb-bg);
    z-index: 1;
}
.mask {
    --linear-color: #c2c2c2;
    width: 100%;
    height: calc(100% - 65px);
    overflow: hidden;
    background-image:
        linear-gradient(45deg,
            var(--linear-color) 25%,
            transparent 0,
            transparent 75%,
            var(--linear-color) 0),
        linear-gradient(45deg,
            var(--linear-color) 25%,
            transparent 0,
            transparent 75%,
            var(--linear-color) 0);
    background-position: 0 0, 8px 8px;
    background-size: 16px 16px;
    position: absolute;

}

.image {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    user-select: none;

    img {
        cursor: grab;
        -webkit-user-drag: none;
        object-fit: contain;

        &:active {
            cursor: grabbing;
        }
    }
}

.image-controller {
    display: flex;
    width: 200px;
    position: absolute;
    bottom: 20px;
    left: calc(50% - 100px);
    align-items: center;
    justify-content: space-between;
    background-color: var(--eb-bg);
    padding: 0 20px;
    border-radius: 5px;
}
</style>
