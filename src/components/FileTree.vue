<script setup lang="ts">
import Draggable from 'vuedraggable'
import type { FileNode, TreeProps } from './types'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

const props = withDefaults(defineProps<TreeProps>(), { indent: 10 })
const theme = useTheme()

const next_indent = computed(() => {
    return props.indent + props.indent / props.level
})
const line_width = computed(() => {
    return `${props.indent * 2}px`
})
const status = useStatus()

function toggle(e: MouseEvent, node: FileNode) {
    if (e.button !== 0) {
        return
    }
    
    status.add_tab(node)
    status.open(node)
}
</script>

<template>
  <draggable
    :list="files"
    animation="300"
    force-fallback
    item-key="id"
    draggable=".draggable"
    v-bind="{
      multiDrag: true,
      selectedClass: 'selected',
      multiDragKey: 'ctrl',
      avoidImplicitDeselect: true,
    }"
  >
    <template #item="{ element: node }">
      <q-list>
        <div :class="{ draggable: node.type === 'html' }">
          <q-menu
            context-menu
            :dark="theme.dark"
          >
            <q-list>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  删除
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  重命名
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  添加副本
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  添加文件
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <div
            hover="cursor-pointer bg-var-vscode-toolbar-hoverBackground"
            :class="{ selected: node.selected }"
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
      </q-list>
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
