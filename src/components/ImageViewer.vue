<script setup lang="ts">
import type { Directive } from 'vue'
import type { TouchPanValue } from 'quasar'
import type { HTMLEventManage } from '@/utils/event'
import { useElementRef } from '@/composables/useComp'
import { useEPUB } from '@/stores/epub'
import { DISPLAY } from '@/static'

const props = defineProps<{ src: string }>()
const event_list = [] as HTMLEventManage<any>[]
const image_size = reactive({ width: 0, height: 0 })
const mask_class = ref('mask-transparent')

const controller = useElementRef<HTMLDivElement>()
const epub = useEPUB()

const image_position = reactive({
    scale: 1, // 缩放倍数
    top: 0,
    left: 0,
    deg: 0, // 旋转角度
    size: '', // 图片短边长度
})

const image_size_label = computed(() => `图片尺寸： ${image_size.width} * ${image_size.height}`)

const touch_store = {
    pageX: 0,
    pageY: 0,
    pageX2: 0,
    pageY2: 0,
    resizeable: false,
    draggable: true,
}

// 图片蒙层样式
const mask_style = computed(() => {
    return `top:${image_position.top}px;left:${image_position.left}px`
})

// 缩放
const pic_scale = (scale: number) => {
    image_position.scale += scale
    if (image_position.scale > 5) {
        image_position.scale = 5
    }
    if (image_position.scale < 0.3) {
        image_position.scale = 0.3
    }
}

// 图片样式
const image_style = computed(() => {
    return `transform:scale(${image_position.scale}) rotate(${image_position.deg}deg);${image_position.size}`
})

function resize_onscroll(e: WheelEvent) {
    e.preventDefault()
    pic_scale(-e.deltaY / 1000)

    return false
}

// 拖动
const drag_move: TouchPanValue = function(details) {
    if (touch_store.draggable) {
        image_position.top += details!.delta!.y!
        image_position.left += details!.delta!.x!
    }
}

// 重置
const size_reset = () => {
    image_position.deg = 0
    image_position.top = 0
    image_position.left = 0
    image_position.scale = 1
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
            image_position.size = `width:${naturalWidth}px;height:${naturalHeight}px`
        }
        else if (img_radio > radio) {
            image_position.size = 'width:100%'
        }
        else {
            image_position.size = 'height:100%'
        }
        
        epub.display = DISPLAY.IMAGE
    }
}

const mouse_moving = ref(false)
let mouse_is_down = false
let timer = 0
function show_controller() {
    if (mouse_moving.value) {
        clearTimeout(timer)
    }
    else {
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
    size_reset()
})

onBeforeUnmount(() => {
    for (const eventItem of event_list) {
        eventItem.removeEventListener()
    }
})
</script>

<template>
  <div
    :class="mask_class"
    @mousemove="mouse_move"
  >
    <div
      v-show="mouse_moving"
      class="image-size"
    >
      {{ image_size_label }}
    </div>
    <div  
      :style="mask_style"
      class="image"
      @mousewheel="resize_onscroll"
    >
      <img
        v-touch-pan.prevent.mouse="drag_move"
        v-take-size
        :src="src"
        :alt="src"
        :style="image_style"
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
        v-model="image_position.scale"
        class="scale-slider"
        :step="0.1"
        :min="0.3"
        :max="5"
        @pan="mouse_pan"
      />
      <div
        class="i-ic:sharp-restart-alt"
        h="50"
        w="50"
        m="l-20"
        op="80 hover:100"
        cursor-pointer
        @click="size_reset"
      />
      <div
        class="i-radix-icons:transparency-grid"
        h="50"
        w="50"
        m="l-20"
        bg="var-eb-fg"
        op="60 hover:100"
        cursor-pointer
        @click="mask_class = 'mask-transparent'"
      />
      <div
        class="i-ic:baseline-wb-sunny"
        h="50"
        w="50"
        m="l-20"
        op="60 hover:100"
        cursor-pointer
        @click="mask_class = 'mask-light'"
      />
      <div
        class="i-ic:baseline-nights-stay"
        h="50"
        w="50"
        m="l-20"
        op="60 hover:100"
        cursor-pointer
        @click="mask_class = 'mask-black'"
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
.mask-transparent {
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

.mask-black {
    width: 100%;
    height: calc(100% - 65px);
    overflow: hidden;
    background-color: #000;
    position: absolute;
}

.mask-light {
    width: 100%;
    height: calc(100% - 65px);
    overflow: hidden;
    background-color: #fff;
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
    width: 300px;
    position: absolute;
    bottom: 20px;
    left: calc(50% - 100px);
    align-items: center;
    justify-content: space-between;
    background-color: var(--eb-bg);
    padding: 0 20px;
    border-radius: 5px;
    color: var(--vscode-progressBar-background);
}
</style>
