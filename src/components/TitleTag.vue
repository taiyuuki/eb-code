<script setup lang="ts">
import type { FileNode } from './types'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { basename } from '@/utils'

const props = defineProps<{ node: FileNode }>()
const emit = defineEmits<{
    (e: 'open', node: FileNode): void,
    (e: 'close', node: FileNode): void
}>()
const theme = useTheme()
const status = useStatus()

const tag_name = computed(() => {
    return basename(props.node.id)
})
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
    <q-menu
      context-menu
      :dark="theme.dark"
      bg="var-eb-bg"
      text="var-eb-fg"
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
          @click="status.close_other(node)"
        >
          <q-item-section>
            关闭其他
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="status.close_right(node)"
        >
          <q-item-section>
            关闭右侧标签
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="status.close_left(node)"
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
      class="i-ic:baseline-cancel close-btn"
      op="50 hover:100"
      display-inline-block
      invisible
      middle
      w="20"
      h="20"
      @click="emit('close', node)"
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
@/stores/status
