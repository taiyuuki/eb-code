<script setup lang="ts">
import { changed } from '@/invoke'
import { useEPUB } from '@/stores/epub'

const epub = useEPUB()
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
    <div v-show="epub.editable">
      {{ epub.save_path || 'Unnamed.epub' }} <span v-show="changed.dirty">*</span> - epub {{ epub.version }}
    </div>
    <div flex="~">
      <div
        v-show="epub.is_saving"
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
