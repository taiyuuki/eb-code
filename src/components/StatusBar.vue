<script setup lang="ts">
import { useStatus } from '@/stores/status'

const status = useStatus()
</script>

<template>
  <div
    h="30"
    bg="var-eb-bg"
    text="var-eb-fg"
    pst="fix b-0 l-0 r-0"
    p="x-20"
    flex="~ items-center justify-between"
    select-none
    z-2
  >
    <div>{{ status.current.file_name }}</div>
    <div v-show="status.show_code">
      {{ status.current.lang }}
    </div>
  </div>
</template>
