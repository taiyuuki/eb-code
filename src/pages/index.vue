<script setup lang="ts">
import Draggable from 'vuedraggable'
import { TauriEvent } from '@tauri-apps/api/event'
import { getCurrent } from '@tauri-apps/api/window'
import type { FileNode } from '@/components/types'
import { themes } from '@/editor/themes'
import { NOT_SUPPORTED_THEMES } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { DISPLAY, useStatus } from '@/stores/status'
import { invoke_clean_cache } from '@/invoke'

const splitterModel = ref(300)
const supported_themes = themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t))
const theme = useTheme()
const status = useStatus()
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

function open_file(node: FileNode) {
    status.open(node)
}

function close_file(node: FileNode) {
    status.remve_tag_by_id(node.id)
    if (node.open) {
        status.open_first()
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

// listen('get-text', (event: Event<[string, Language, string]>) => {
//     status.current.code = event.payload[0]
//     status.current.lang = event.payload[1]
//     const id = event.payload[2]
//     status.current.id = id
//     scroll_top_to(status.get_top(id))
//     status.is_reading = false
//     status.is_toogle = false
// })

app_window.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
    invoke_clean_cache(status.dir).then(() => {
        app_window.destroy()
    })
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
    <div
      flex="~"
      style="height: calc(100vh - 105px);"
    >
      <NaviBar />
      <q-splitter
        v-model="splitterModel"
        unit="px"
        :limits="[300, Infinity]"
        separator-class="bg-var-eb-fg"
        flex="1"
      >
        <template #before>
          <q-scroll-area
            style="height: calc(100vh - 115px);"
            :thumb-style="thumb_style"
          >
            <router-view />
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
                :list="status.tabs"
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
            v-show="status.display === DISPLAY.CODE"
            :language="status.current.lang"
            :code="status.current.code"
          />
          <ImageViewer
            v-show="status.display === DISPLAY.IMAGE"
            :src="status.current.src"
          />
          <SetMeta v-show="status.display === DISPLAY.METADATA" />
        </template>
      </q-splitter>
    </div>
  </q-page>
</template>
