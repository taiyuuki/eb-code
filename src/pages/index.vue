<script setup lang="ts">
import Draggable from 'vuedraggable'
import { TauriEvent } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ask } from '@tauri-apps/plugin-dialog'
import { arr_remove } from '@taiyuuki/utils'
import type { FileNode } from '@/components/types'
import { DISPLAY } from '@/static'
import { useTheme } from '@/stores/theme'
import { useEPUB } from '@/stores/epub'
import { changed, invoke_clean_cache } from '@/invoke'
import { useActivity } from '@/composables/useActivity'
import { usePreview } from '@/stores/preview'

const preview = usePreview()
const theme = useTheme()
const epub = useEPUB()
const app_window = getCurrentWindow()
const activity_node = useActivity()

const sidebar_width = ref(250)

const preview_limits = computed(() => preview.display ? [0, Infinity] : [0, 0])

function open_file(node: FileNode) {
    epub.open(node)
}

function close_file(node: FileNode) {
    if (node.open) {
        epub.open_pre(node)
    }
    else {
        arr_remove(epub.tabs, node)
    }
    if (epub.tabs.length === 0) {
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
    if (epub.dir) {
        await invoke_clean_cache(epub.dir).finally(() => {
          
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
    v-show="epub.editable"
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
            :limits="preview_limits"
            :disable="!preview.display"
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
                      :list="epub.tabs"
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
                v-show="epub.display === DISPLAY.CODE"
                :language="epub.current.lang"
                :code="epub.current.code"
              />
          
              <ImageViewer
                v-show="epub.display === DISPLAY.IMAGE"
                :src="epub.current.src"
              />
              <MetaSet v-if="epub.display === DISPLAY.METADATA" />
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
