<script setup lang="ts">
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

const status = useStatus()
const theme = useTheme()
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div
      w="min-50"
      flex="~ justify-end"
    >
      按钮
    </div>
  </TitleBanner> 
  <FileTree
    :files="status.nodes"
    :level="1"
  />
</template>
