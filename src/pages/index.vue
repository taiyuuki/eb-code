<script setup lang="ts">
import Draggable from 'vuedraggable'
import { TauriEvent } from '@tauri-apps/api/event'
import { getCurrent } from '@tauri-apps/api/window'
import { ask } from '@tauri-apps/plugin-dialog'
import type { FileNode } from '@/components/types'
import { DISPLAY } from '@/static'
import { useTheme } from '@/stores/theme'
import { useStatus } from '@/stores/status'
import { changed, invoke_clean_cache } from '@/invoke'
import { useActivity } from '@/composables/useActivity'
import { usePreview } from '@/stores/preview'

const preview = usePreview()
const theme = useTheme()
const status = useStatus()
const app_window = getCurrent()
const activity_node = useActivity()

const sidebar_width = ref(250)

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

app_window.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, async() => {
    if (changed.dirty) {
        const conf = await ask('当前文件尚未保存，是否继续？', {
            title: '确认',
            okLabel: '是',
            cancelLabel: '否',
        })
        if (conf) {
            changed.dirty = false
        }
        else {
            return
        }
    }
    if (status.dir) {
        await invoke_clean_cache(status.dir).finally(() => {
          
            app_window.destroy()
        })
    }
    else {
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
    <div
      flex="~"
      style="height: calc(100vh - 105px);"
    >
      <NaviBar />
      <q-splitter
        v-model="sidebar_width"
        unit="px"
        :limits="[250, 600]"
        separator-class="sprt"
        flex="1"
      >
        <template #before>
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </template>
  
        <template #after>
          <q-splitter
            v-model="preview.width"
            :limits="[0, Infinity]"
            unit="px"
            separator-class="sprt"
            reverse
            @update:model-value="(v) => { if (v === 0) { preview.close() } }"
          >
            <template #before>
              <TitleBanner
                :dark="theme.dark"
                dense
              >
                <div 
                  flex="~ justify-between items-center"
                >
                  <q-scroll-area
                    visible
                    style="height: 50px;"
                    class="tag-scroll"
                    flex="1"
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
                  <div
                    class="i-codicon:layout-sidebar-right"
                    w="20"
                    h="20"
                    m="x-5"
                    op="60 hover:100"
                    pointer
                    @click="preview.toggle"
                  />
                </div>
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
            <template #after>
              <HtmlPreview v-if="preview.display" />
            </template>
          </q-splitter>
        </template>
      </q-splitter>
    </div>
    <!-- 设置封面 -->
    <CoverSet />
    <!-- 设置目录 -->
    <ContentsSet />
  </q-page>
</template>

<style>
.tag-scroll .q-scrollarea__thumb {
    background-color: var(--vscode-scrollbarSlider-background);
    width: 14px;
    border-radius: 0;
    opacity: 0;
}

.tag-scroll .q-scrollarea__thumb:hover {
    background-color: var(--vscode-scrollbarSlider-hoverBackground);
    opacity: 1;
}

.tag-scroll .q-scrollarea__thumb:active {
    background-color: var(--vscode-scrollbarSlider-activeBackground);
    opacity: 1;
}
</style>
