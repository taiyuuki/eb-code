<script setup lang="ts">
import { math_between } from '@taiyuuki/utils'
import { useTheme } from '@/stores/theme'
import { useOption } from '@/stores/option'

const theme = useTheme()
const option = useOption()

const indent_error = computed(() => {
    return option.value.indent < 2 || option.value.indent > 10
})

const font_size_error = computed(() => {
    return option.value.font_size < 14 || option.value.font_size > 40
})

const has_error = computed(() => {
    return indent_error.value || font_size_error.value
})

function reset() {
    option.$reset()
    option.save()
}

option.$subscribe(() => {
    !has_error.value && option.save()
})
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div
      m="x-5"
      text="20 bold"
    >
      编辑器设置
    </div>
  </TitleBanner>
  <div
    class="q-gutter-sm"
    flex="~ justify-end"
    p="10"
  >
    <q-btn
      label="恢复默认设置"
      @click="reset"
    />
  </div>
  <q-scroll-area
    visible
    style="height: calc(100vh - 220px);padding: 10px;"
  >
    <div m="b-10">
      <q-input
        :model-value="option.value.indent"
        type="number"
        :error="indent_error"
        bottom-slots
        hide-bottom-space
        dense
        debounce="500"
        tabindex="100"
        outlined
        label="缩进"
        :dark="theme.dark"
        @update:model-value="(v) => { option.value.indent = math_between(Number(v), 2, 10) }"
      >
        <template #error>
          <div v-if="indent_error">
            缩进值建议在2~10之间
          </div>
        </template>
      </q-input>
    </div>
    <div m="b-10">
      <q-input
        :model-value="option.value.font_size"
        type="number"
        :error="font_size_error"
        bottom-slots
        hide-bottom-space
        dense
        debounce="500"
        tabindex="100"
        outlined
        label="字体大小"
        :dark="theme.dark"
        @update:model-value="(v) => { option.value.font_size = math_between(Number(v), 14, 40) }"
      >
        <template #error>
          <div v-if="font_size_error">
            字体大小建议在14~40之间
          </div>
        </template>
      </q-input>
    </div>
    <div m="b-10">
      <q-checkbox
        v-model="option.value.line_numbers"
        :dark="theme.dark"
        label="显示行号"
      />
    </div>
    <div m="b-10">
      <q-checkbox
        v-model="option.value.minimap"
        :dark="theme.dark"
        label="小地图"
      />
    </div>
    <div m="b-10">
      <q-checkbox
        v-model="option.value.cursor_animation"
        :dark="theme.dark"
        label="光标移动动画"
      />
    </div>
    <div m="b-10">
      <q-checkbox
        v-model="option.value.wordWrap"
        :dark="theme.dark"
        label="自动换行"
      />
    </div>
    <div m="b-10">
      <q-checkbox
        v-model="option.value.smooth_scrolling"
        :dark="theme.dark"
        label="滚动条平滑滚动"
      />
    </div>
  </q-scroll-area>
</template>
