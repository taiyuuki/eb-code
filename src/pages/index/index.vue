<script setup lang="ts">
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

const status = useStatus()
const theme = useTheme()
</script>

<template>
  <q-scroll-area
    style="height: calc(100vh - 115px);"
  >
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
  </q-scroll-area>
</template>
