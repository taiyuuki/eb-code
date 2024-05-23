<script setup lang="ts">
import type { ContentsNode } from './types'
import { useStatus } from '@/stores/status'
import { activity_contents } from '@/composables/useActivity'

defineProps<{ contents: ContentsNode[] }>()

const status = useStatus()

function open(e: MouseEvent, node: ContentsNode) {
    e.stopPropagation()
    if (activity_contents.selected_node) {
        activity_contents.selected_node.selected = false
    }

    activity_contents.selected_node = node
    activity_contents.selected_node.selected = true

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
    p="l-20"
  >
    <div
      flex="~ justify-start items-center" 
      :class="{ contents: true, selected: node.selected }"
    >
      <div
        v-if="node.children"
        :class="node.expanded ? 'i-ic:outline-keyboard-arrow-down' : 'i-ic:outline-keyboard-arrow-right'"
        middle
        w="20"
        h="20"
        pointer
        @click="node.expanded = !node.expanded"
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
        border="l-solid var-eb-fg l-2"
        m="l-9"
      >
        <ContentsTree
          :contents="node.children"
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
