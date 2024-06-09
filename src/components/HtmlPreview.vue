<script setup lang="ts">
import { usePreview } from '@/stores/preview'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

defineEmits<{
    (e: 'display', display: boolean): void
}>()
const $iframe = ref<HTMLIFrameElement>()
const preview = usePreview()
const status = useStatus()
const theme = useTheme()

const url = computed(() => {

    return `http://127.0.0.1:${preview.port}/static/${status.dir}/${preview.id}`
})

watch(() => preview.need_reload, () => {
    if ($iframe.value && preview.need_reload) {
        $iframe.value.src = url.value
        preview.need_reload = false
    }
})

function close_preview() {
    preview.close()
}
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div
      m="x-5"
      flex="~ justify-between items-center"
    >
      <div text="20 bold">
        预览
      </div>
      <div
        class="i-ic:baseline-close"
        h="36"
        w="36"
        pointer
        title="关闭预览"
        op="60 hover:100"
        @click="close_preview"
      />
    </div>
  </TitleBanner>
  <iframe
    ref="$iframe"
    style="height: calc(100% - 55px); width: 100%; background-color: #fff;"
    :src="url"
  />
</template>
