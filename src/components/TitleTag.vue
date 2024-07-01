<script setup lang="ts">
import type { FileNode } from './types'
import { useEPUB } from '@/stores/epub'
import { basename } from '@/utils/path'
import { vScrollview } from '@/directives/v-scrollview'
import { vVisible } from '@/directives/v-visible'

const props = defineProps<{ node: FileNode }>()
const emit = defineEmits<{
    (e: 'open', node: FileNode): void,
    (e: 'close', node: FileNode): void
}>()

const epub = useEPUB()

const tag_name = computed(() => {
    return basename(props.node.name)
})

function open(e: MouseEvent) {
    if (e.button !== 0) return
    emit('open', props.node)
}

function close(e: MouseEvent, node: FileNode) {
    if (e.button !== 0) return
    emit('close', node)
}
</script>

<template>
  <div
    v-scrollview="node.open"
    :class="{ 'list-selection': true, 'selected': node.open }"
    hover="[&>.close-btn]:visible!"
    pointer
    h="100%"
    p="y-15 x-5"
    whitespace-nowrap
    @mousedown="open($event)"
  >
    <q-menu
      context-menu
    >
      <q-list>    
        <q-item
          v-close-popup
          clickable
          @click="emit('close', node)"
        >
          <q-item-section>
            关闭
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="epub.close_other(node)"
        >
          <q-item-section>
            关闭其他
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="epub.close_right(node)"
        >
          <q-item-section>
            关闭右侧标签
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="epub.close_left(node)"
        >
          <q-item-section>
            关闭左侧标签
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <div
      :class="node.icon"
      display-inline-block
      middle
      w="20"
      h="20"
    />
    {{ tag_name }}
    <div
      v-visible="node.open"
      class="i-ic:baseline-cancel close-btn"
      op="60 hover:100"
      display-inline-block
      middle
      w="20"
      h="20"
      @click="close($event, node)"
      @mousedown="$event.stopPropagation()"
    />
  </div>
</template>
