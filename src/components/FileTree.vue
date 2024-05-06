<script setup lang="ts">
import { useActivity } from 'composables/useActivity'
import Draggable from 'vuedraggable'
import type { FileNode, TreeProps } from './types'
import { useTags } from '@/stores/tag'
import { invoke_get_text } from '@/invoke'
import { useCode } from '@/stores/code'
import { is_text } from '@/utils'
import { useScrollTop } from '@/stores/scroll-top'
import { get_scroll_top, scroll_top_to } from '@/editor'

const activity_node = useActivity()
const props = withDefaults(defineProps<TreeProps>(), { indent: 10 })
const code = useCode()
const scroll_top = useScrollTop()

const next_indent = computed(() => {
    return props.indent + props.indent / props.level
})
const line_width = computed(() => {
    return `${props.indent * 2}px`
})
const tags = useTags()

function toggle(node: FileNode) {
    if (activity_node.opened_node) {
        const line = get_scroll_top()
        scroll_top.add(activity_node.opened_node.id, line)
    }
    
    activity_node.on(node)
    tags.add_tag(node)
    if (tags.has_code(node.id)) {
        code.value = tags.codes[node.id].code
        code.lang = tags.codes[node.id].lang
        if (scroll_top.has(node.id)) {
            scroll_top_to(scroll_top.get(node.id))
        }

        return
    }
    if (is_text(node.name)) {
        invoke_get_text(node.name)
    }
}
</script>

<template>
  <draggable
    :list="files"
    animation="300"
    force-fallback
    item-key="id"
  >
    <template #item="{ element: node }">
      <div>
        <div
          hover="cursor-pointer bg-var-vscode-toolbar-hoverBackground"
          :class="{ selected: node.selected }"
          middle
          p="y-2"
          text="14"
          whitespace-nowrap
          @mousedown="toggle(node)"
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
        <div 
          v-if="node.children"
          v-show="node.expanded"
          :style="{ textIndent: `${indent}px` }"
          :class="{ 'folder': true, 'folder-not-active': !node.active, 'folder-active': node.active }"
        >
          <FileTree
            :files="node.children"
            :indent="next_indent"
            :level="level + 1"
          />
        </div>
      </div>
    </template>
  </draggable>
</template>

<style>
div.selected {
  background-color: var(--vscode-toolbar-activeBackground);
}

div.selected:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
}

.folder {
  position: relative;
}

.folder::before {
  content: '';
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: v-bind(line_width);
  border-right: 1px solid;
}

.folder-not-active::before {
  border-color: var(--eb-border);
}

.folder-active::before {
  border-color: var(--eb-active-border);
}
</style>
@/stores/scroll-top
