<script setup lang="ts">
import { usePreview } from '@/stores/preview'
import { useStatus } from '@/stores/status'

const $iframe = ref<HTMLIFrameElement>()
const preview = usePreview()
const status = useStatus()
const display = computed(() => {
    return preview.port && status.dir && preview.id
})

const url = computed(() => {
    return `http://127.0.0.1:${preview.port}/static/${status.dir}/${preview.id}`
})

watch(() => preview.need_reload, () => {
    if ($iframe.value && preview.need_reload) {
        $iframe.value.src = url.value
        preview.need_reload = false
    }
})
</script>

<template>
  <iframe
    v-if="display"
    ref="$iframe"
    h="100%"
    w="100%"
    bg="white"
    :src="url"
  />
</template>
