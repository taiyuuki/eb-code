<script setup lang="ts">
import type { FileNode } from './types'
import { vScrollview } from '@/directives/v-scrollview'

defineProps<{ node: FileNode, level: number, indent: number }>()
const emit = defineEmits<{ (e: 'toggle', node: FileNode): void }>()

function toggle(e: MouseEvent, node: FileNode) {
    if (e.button !== 0) return
    emit('toggle', node)
}
</script>

<template>
  <div
    v-scrollview="node.selected"
    pointer
    :class="{ 'list-selection': true, 'selected': node.selected }"
    middle
    p="y-2"
    text="14"
    whitespace-nowrap
    select-none
    @mousedown="toggle($event, node)"
  >
    <div
      v-if="node.children"
      :class="node.expanded ? 'i-ic:outline-keyboard-arrow-down' : 'i-ic:outline-keyboard-arrow-right'"
      display-inline-block
      middle
      w="20"
      h="20"
      :style="`margin-left: ${indent}px`"
    />
    <div
      v-else
      display-inline-block
      w="20"
      h="20"
    />
    <div
      :class="node.icon"
      display-inline-block
      middle
      w="20"
      h="20"
      :style="`margin-left: ${node.children ? 0 : indent}px`"
    />
    {{ node.name }}
  </div>
</template>
