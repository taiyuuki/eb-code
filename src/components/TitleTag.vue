<script setup lang="ts">
import type { FileNode } from './types'

defineProps<{ node: FileNode }>()
const emit = defineEmits<{ 
    (e: 'close', node: FileNode): void,
    (e: 'open', node: FileNode): void }>()

function close(e: MouseEvent, node: FileNode) {
    e.stopPropagation()
    emit('close', node)
}
</script>

<template>
  <div
    hover="cursor-pointer bg-var-eb-file-hover [&>.close-btn]:visible"
    :class="{ opened: node.open }"
    h="100%"
    p="15"
    whitespace-nowrap
    @mousedown="emit('open', node)"
  >
    <div
      :class="node.icon"
      display-inline-block
      middle
      w="20"
      h="20"
    />
    {{ node.name }}
    <div
      class="i-ic:baseline-cancel close-btn"
      op="50 hover:100"
      display-inline-block
      invisible
      middle
      w="20"
      h="20"
      @click="close($event, node)"
      @mousedown="$event.stopPropagation()"
    />
  </div>
</template>

<style>
div.opened {
  background-color: var(--vscode-toolbar-activeBackground);
}

div.opened:hover {
  background-color: var(--vscode-toolbar-activeBackground);
}
</style>
