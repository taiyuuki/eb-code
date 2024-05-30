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
    w="100%"
    z-2
  >
    <div v-show="status.editable">
      {{ status.current.save_path || 'Unnamed.epub' }} - epub {{ status.epub_version }}
    </div>
    <div flex="~">
      <div
        v-show="status.is_saving"
        flex="~ items-center justify-between"
      >
        <div
          middle
        >
          保存中 
        </div>
        <div
          h="15"
          w="15"
          m="l-5"
          class="i-line-md:loading-twotone-loop"
        />
      </div>
    </div>
  </div>
</template>
