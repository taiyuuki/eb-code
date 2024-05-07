<script setup lang="ts">
import Draggable from 'vuedraggable'
import type { Event } from '@tauri-apps/api/event'
import { TauriEvent, listen } from '@tauri-apps/api/event'
import { getCurrent } from '@tauri-apps/api/window'
import type { FileNode } from '@/components/types'
import { themes } from '@/editor/themes'
import type { Language } from '@/editor/shiki'
import { NOT_SUPPORTED_THEMES } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { useStatus } from '@/stores/status'
import { useActivity } from '@/composables/useActivity'
import { useTree } from '@/stores/useTree'
import { get_scroll_top, scroll_top_to } from '@/editor'
import { invoke_clean_cache, invoke_write_text } from '@/invoke'
import { is_text } from '@/utils'

const splitterModel = ref(300)
const supported_themes = themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t))
const theme = useTheme()
const status = useStatus()
const tree = useTree()
const app_window = getCurrent()

const options = supported_themes
    .map(t => t.split('-')
        .map(t => t.charAt(0).toUpperCase() + t.slice(1))
        .join(' '))

const selected_theme = ref(options[supported_themes.indexOf(theme.shiki)])

function setTheme(t: string) {
    theme.setTheme(supported_themes[options.indexOf(t)])
}

const thumb_style = {
    width: '14px',
    background: 'var(--vscode-scrollbarSlider-activeBackground)',
    borderRadius: '0',
}

const activity_node = useActivity()

function open_file(node: FileNode) {
    if (activity_node.opened_node === node) {
        return
    }
    if (activity_node.opened_node) {
        const line = get_scroll_top()
        status.add_top(activity_node.opened_node.id, line)
    }
    status.on_change_node(node, activity_node.opened_node)
    activity_node.open(node)
    activity_node.activate(node)
    activity_node.select(node)
}

function close_file(node: FileNode) {
    status.remve_tag_by_id(node.id)
    if (node.open) {
        if (status.current.is_dirty) {
            invoke_write_text(status.dir, node.id, status.current.code)
        }
        if (status.nodes[0]) {
            if (is_text(status.nodes[0].id)) {
                activity_node.open(status.nodes[0])
                status.current.code = status.codes[status.nodes[0].id].code
                status.current.lang = status.codes[status.nodes[0].id].lang
                status.current.id = status.nodes[0].id
                scroll_top_to(status.get_top(status.nodes[0].id))
            }
        }
    }

}

function scroll_ytx(e: WheelEvent) {
    const target = e.target as HTMLElement
    let scroll_el = target.parentElement
    let count = 5
    while (scroll_el && !scroll_el.classList.contains('scroll') && count > 0) {
        scroll_el = scroll_el.parentElement
        count--
    }
    if (count && scroll_el) {
        scroll_el.scrollLeft += e.deltaY
    }
}

listen('get_text', (event: Event<[string, Language, string]>) => {
    status.current.code = event.payload[0]
    status.current.lang = event.payload[1]
    const id = event.payload[2]
    status.current.id = id
    status.codes[id] = { code: status.current.code, lang: status.current.lang }
    scroll_top_to(status.get_top(id))
})

app_window.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
    invoke_clean_cache(status.dir)
})

listen('clean-success', () => {
    app_window.destroy()
})
</script>

<template>
  <q-page
    class="monaco-component"
    pst="rel"
    style="min-height: inherit;"
  >
    <div flex="~">
      <q-select
        v-model="selected_theme"
        square
        outlined
        dense
        label="主题颜色"
        popup-content-class="bg-var-eb-bg text-var-eb-fg"
        color="fg"
        :options="options"
        :dark="theme.dark"
        @update:model-value="setTheme"
      />
    </div>
    <q-splitter
      v-model="splitterModel"
      unit="px"
      :limits="[300, Infinity]"
      separator-class="bg-var-eb-fg"
      h="100vh"
    >
      <template #before>
        <TitleBanner
          :dark="theme.dark"
          dense
        >
          资源管理器
        </TitleBanner> 
        <q-scroll-area
          style="height: calc(100vh - 160px);"
          :thumb-style="thumb_style"
        >
          <FileTree
            :files="tree.nodes"
            :level="1"
          />
        </q-scroll-area>
      </template>

      <template #after>
        <TitleBanner
          :dark="theme.dark"
          dense
        >
          <q-scroll-area
            style="height: 50px;" 
            :thumb-style="thumb_style"
            @mousewheel.prevent="scroll_ytx"
          >
            <draggable
              :list="status.nodes"
              item-key="id"
              animation="200"
              force-fallback
              class="flex items-center flex-nowrap"
            >
              <template #item="{ element: node }">
                <TitleTag
                  :node="node"
                  @close="close_file"
                  @open="open_file"
                />
              </template>
            </draggable>
          </q-scroll-area>
        </TitleBanner>
        <CodeEditor
          :language="status.current.lang"
          :code="status.current.code"
        />
      </template>
    </q-splitter>
  </q-page>
</template>
@/stores/status
