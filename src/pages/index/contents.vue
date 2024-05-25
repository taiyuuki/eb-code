<script setup lang="ts">
import { useStatus } from '@/stores/status'
import { activity_contents } from '@/composables/useActivity'
import type { ContentsNode } from '@/components/types'
import { useTheme } from '@/stores/theme'
import { contents_setting } from '@/composables/contents_setting'

const status = useStatus()
const theme = useTheme()

function open(node: ContentsNode) {
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
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div flex="~ justify-between items-center">
      <div text="20 bold">
        目录
      </div>
      <div
        class="i-ic:baseline-edit-note"
        h="36"
        w="36"
        pointer
        title="编辑目录"
        op="60 hover:100"
        @click="contents_setting = true"
      />
    </div>
  </TitleBanner>
  <q-scroll-area
    style="height: calc(100vh - 170px);"
  >
    <ContentsTree
      :contents="status.contents_tree"
      :edit="false"
      @open="open"
    />
  </q-scroll-area>
</template>
