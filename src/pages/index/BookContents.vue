<script setup lang="ts">
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { thumb_style } from '@/composables/thumb_style'

const status = useStatus()
const theme = useTheme()
</script>

<template>
  <q-scroll-area
    style="height: calc(100vh - 115px);"
    :thumb-style="thumb_style"
    :dark="theme.dark"
  >
    <ContentsTree :contents="status.contents_tree" />
  </q-scroll-area>
</template>
