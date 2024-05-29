<script setup lang="ts">
import Draggable from 'vuedraggable'
import { TauriEvent } from '@tauri-apps/api/event'
import { getCurrent } from '@tauri-apps/api/window'
import type { FileNode } from '@/components/types'
import { themes } from '@/editor/themes'
import { DISPLAY, NOT_SUPPORTED_THEMES } from '@/static'
import { useTheme } from '@/stores/theme'
import { useStatus } from '@/stores/status'
import { invoke_clean_cache } from '@/invoke'
import { useActivity } from '@/composables/useActivity'

const sidebar_width = ref(300)
const supported_themes = themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t))
const theme = useTheme()
const status = useStatus()
const app_window = getCurrent()
const activity_node = useActivity()

const options = supported_themes
    .map(t => t.split('-')
        .map(t => t.charAt(0).toUpperCase() + t.slice(1))
        .join(' '))

const selected_theme = ref(options[supported_themes.indexOf(theme.shiki)])

function set_theme(t: string) {
    theme.set_theme(supported_themes[options.indexOf(t)])
}

function open_file(node: FileNode) {
    status.open(node)
}

function close_file(node: FileNode) {
    status.remove_tab_by_id(node.id)
    if (node.open) {
        status.open_first()
    }
    if (status.tabs.length === 0) {
        activity_node.close()
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

app_window.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
    if (status.dir) {
        invoke_clean_cache(status.dir).then(() => {
            app_window.destroy()
        })
    } else {
        app_window.destroy()
    }
})
</script>

<template>
  <q-page
    v-show="status.editable"
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
        @update:model-value="set_theme"
      />
    </div>
    <div
      flex="~"
      style="height: calc(100vh - 105px);"
    >
      <NaviBar />
      <q-splitter
        v-model="sidebar_width"
        unit="px"
        :limits="[300, Infinity]"
        separator-class="bg-var-eb-fg"
        flex="1"
      >
        <template #before>
          <router-view />
        </template>
  
        <template #after>
          <TitleBanner
            :dark="theme.dark"
            dense
          >
            <q-scroll-area
              visible
              style="height: 50px;"
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
          <MetaSet v-if="status.display === DISPLAY.METADATA" />
        </template>
      </q-splitter>
    </div>
    <!-- 设置封面 -->
    <CoverSet />
    <!-- 设置目录 -->
    <ContentsSet />
  </q-page>
</template>

