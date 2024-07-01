<script setup lang="ts">
import { useEPUB } from '@/stores/epub'
import { activity_contents } from '@/composables/useActivity'
import type { ContentsNode } from '@/components/types'
import { useTheme } from '@/stores/theme'
import { contents_setting } from '@/composables/contents_setting'

const epub = useEPUB()
const theme = useTheme()

function open(node: ContentsNode) {
    if (activity_contents.selected_node) {
        activity_contents.selected_node.selected = false
    }

    activity_contents.selected_node = node
    activity_contents.selected_node.selected = true

    const [id, $id] = node.id.split('#')
    if (node.id in epub.contents_id_lnum) {
        epub.open_by_id(id, epub.contents_id_lnum[node.id], $id ? `#${$id}` : undefined)
    }
    else {
        epub.open_by_id(id, 1)
    }
}
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div flex="~ justify-between items-center">
      <div
        m="x-5"
        text="20 bold"
      >
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
    visible
    style="height: calc(100vh - 170px);padding-bottom: 12px;"
  >
    <ContentsTree
      :contents="epub.contents_tree"
      :edit="false"
      @open="open"
    />
  </q-scroll-area>
</template>
