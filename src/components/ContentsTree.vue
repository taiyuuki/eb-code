<script setup lang="ts">
import type { ContentsNode } from './types'
import { useStatus } from '@/stores/status'

defineProps<{ contents: ContentsNode[] }>()

const status = useStatus()

function open(e: MouseEvent, node: ContentsNode) {
    e.stopPropagation()

    // TODO: 跳转至id，当前做法是直接删除id
    const i = node.id.lastIndexOf('#')
    let id = node.id
    if (i > 0) {
        id = node.id.substring(0, node.id.indexOf('#'))
    }
    status.open_by_id(id)
}
</script>

<template>
  <div
    v-for="node in contents"
    :key="node.id"
    p="l-2em"
  >
    <div 
      inline-block
      pointer
      @click="open($event, node)"
    >
      {{ node.title }}
    </div>

    <ContentsTree
      v-if="node.children"
      :contents="node.children"
    />
  </div>
</template>
