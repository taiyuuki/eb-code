<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { useEPUB } from '@/stores/epub'
import { is_audio, is_image, is_video } from '@/utils/is'
import { join } from '@/utils/path'

const props = defineProps<{ file: string }>()
const epub = useEPUB()

const src = computed(() => {
    return convertFileSrc(join(epub.base_path, props.file))
})
</script>

<template>
  <div>
    <div v-if="is_image(file)">
      <img
        width="100%"
        :src="src"
        :alt="file"
      >
    </div>
    <div
      v-else-if="is_audio(file)"
    >
      <audio
        controls
        :src="src"
      />
    </div>
    <div
      v-else-if="is_video(file)"
      text="var-eb-fg"
    >
      <video
        width="100%"
        controls
        :src="src"
      />
    </div>
  </div>
</template>
