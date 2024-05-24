<script setup lang="ts">
import type { ContentsNode } from './types'

defineProps<{ contents: Record<number, ContentsNode> }>()
const emit = defineEmits<{
    (e: 'open', node: ContentsNode): void
}>()

function open(e: MouseEvent, node: ContentsNode) {
    e.stopPropagation()
    emit('open', node)
}

function emit_open(node: ContentsNode) {
    emit('open', node)
}

function expand(node: ContentsNode) {
    if (node.children) {
        node.expanded = !node.expanded
    }
}
</script>

<template>
  <div
    v-for="node in contents"
    :key="node.id"
    p="l-20"
    select-none
  >
    <div
      flex="~ justify-start items-center" 
      :class="{ contents: true, selected: node.selected }"
      @click="expand(node)"
    >
      <div
        v-if="node.children?.length"
        :class="node.expanded ? 'i-ic:outline-keyboard-arrow-down' : 'i-ic:outline-keyboard-arrow-right'"
        middle
        w="20"
        h="20"
        pointer
      />
      <div
        v-else
        w="20"
        h="20"
      />
      <div 
        pointer
        m="l-5"
        @click="open($event, node)"
      >
        {{ node.title }}
      </div>
    </div>
    <template
      v-if="node.children"
    >
      <div
        v-show="node.expanded"
        border="l-solid var-eb-fg l-1"
        m="l-9"
      >
        <ContentsTree
          :contents="node.children"
          @open="emit_open"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
div.selected {
  background-color: var(--vscode-toolbar-activeBackground);
}

div.contents:hover {
  background-color: var(--vscode-toolbar-activeBackground);
}
</style>
