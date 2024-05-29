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
    <div text="20 bold">
      书籍资源管理
    </div>
  </TitleBanner>
  <q-scroll-area
    visible
    style="height: calc(100vh - 170px);"
  > 
    <FileTree
      :files="status.nodes"
      :level="1"
    />
  </q-scroll-area>
</template>
