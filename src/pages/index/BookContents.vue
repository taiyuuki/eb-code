<script setup lang="ts">
import { useStatus } from '@/stores/status'

const status = useStatus()
</script>

<template>
  <div>
    <ContentsTree :contents="status.contents_tree" />
  </div>
</template>
