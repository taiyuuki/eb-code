<script setup lang="ts">
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { vMarquee } from '@/directives/v-marquee'

const status = useStatus()
const theme = useTheme()
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div
      flex="~ justify-between items-center nowrap"
      w="100%"
      p="x-20"
    >
      <div
        v-show="status.file_name"
        v-marquee
        flex="1"
        :title="status.file_name"
      >
        <div
          w="100%"
          hover="w-fit text-clip overflow-inherit"
          text="bold ellipsis"
        >
          {{ status.file_name }}
        </div>
      </div>
      <div
        w="min-50"
        flex="~ justify-end"
      >
        按钮
      </div>
    </div>
  </TitleBanner> 
  <FileTree
    :files="status.nodes"
    :level="1"
  />
</template>
