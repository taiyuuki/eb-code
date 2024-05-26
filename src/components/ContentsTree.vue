<script setup lang="ts">
import type { ContentsNode } from './types'

defineProps<{ contents: Record<number, ContentsNode>, edit: boolean }>()
const emit = defineEmits<{
    (e: 'open', node: ContentsNode): void
    (e: 'edit', node: ContentsNode): void
    (e: 'remove', node: ContentsNode): void
    (e: 'up', node: ContentsNode): void
    (e: 'down', node: ContentsNode): void
    (e: 'right', node: ContentsNode): void
    (e: 'left', node: ContentsNode): void
    (e: 'add_up', node: ContentsNode): void
    (e: 'add_down', node: ContentsNode): void
    (e: 'contextmenu', node: ContentsNode): void
}>()

function open(e: MouseEvent, node: ContentsNode) {
    e.stopPropagation()
    emit('open', node)
}

function emit_open(node: ContentsNode) {
    emit('open', node)
}

function emit_edit(node: ContentsNode) {
    emit('edit', node)
}

function emit_remove(node: ContentsNode) {
    emit('remove', node)
}

function emit_up(node: ContentsNode) {
    emit('up', node)
}

function emit_down(node: ContentsNode) {
    emit('down', node)
}

function emit_right(node: ContentsNode) {
    emit('right', node)
}

function emit_left(node: ContentsNode) {
    emit('left', node)
}

function emit_add_up(node: ContentsNode) {
    emit('add_up', node)
}

function emit_add_down(node: ContentsNode) {
    emit('add_down', node)
}

function emit_contextmenu(node: ContentsNode) {
    emit('contextmenu', node)
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
    <q-menu 
      v-if="edit"
      context-menu
      bg="var-eb-bg"
      text="var-eb-fg"
      w="fit"
      @show="emit_contextmenu(node)"
    >
      <q-list>
        <q-item
          v-close-popup
          clickable
          @click="emit_edit(node)"
        >
          <q-item-section>
            编辑
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_remove(node)"
        >
          <q-item-section>
            删除
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_up(node)"
        >
          <q-item-section>
            上移
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_down(node)"
        >
          <q-item-section>
            下移
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_right(node)"
        >
          <q-item-section>
            右移
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_left(node)"
        >
          <q-item-section>
            左移
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_add_up(node)"
        >
          <q-item-section>
            上方添加
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="emit_add_down(node)"
        >
          <q-item-section>
            下方添加
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
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
        flex="1"
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
          :edit="edit"
          @open="emit_open"
          @edit="emit_edit"
          @remove="emit_remove"
          @up="emit_up"
          @down="emit_down"
          @right="emit_right"
          @left="emit_left"
          @add_up="emit_add_up"
          @add_down="emit_add_down"
          @contextmenu="emit_contextmenu"
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
