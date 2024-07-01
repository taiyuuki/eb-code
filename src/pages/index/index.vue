<script setup lang="ts">
import { useEPUB } from '@/stores/epub'
import { useTheme } from '@/stores/theme'

const epub = useEPUB()
const theme = useTheme()
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div
      m="x-5"
      text="20 bold"
    >
      书籍资源管理
    </div>
  </TitleBanner>
  <q-scroll-area
    visible
    style="height: calc(100vh - 165px);padding-bottom: 12px;"
  > 
    <FileTree
      :files="epub.nodes"
      :level="1"
    />
  </q-scroll-area>
</template>
