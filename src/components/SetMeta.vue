<script setup lang="ts">
import { useStatus } from '@/stores/status'

const status = useStatus()
console.log(status.metadata)
</script>

<template>
  <div>设置元数据{{ status.display }}</div>
</template>
