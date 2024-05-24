<script setup lang="ts">
import Draggable from 'vuedraggable'
import { TauriEvent } from '@tauri-apps/api/event'
import { getCurrent } from '@tauri-apps/api/window'
import { convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { FileNode } from '@/components/types'
import { themes } from '@/editor/themes'
import { DISPLAY, NOT_SUPPORTED_THEMES, TREE } from '@/static'
import { useTheme } from '@/stores/theme'
import { useStatus } from '@/stores/status'
import { invoke_clean_cache } from '@/invoke'
import { useActivity } from '@/composables/useActivity'
import { mimetype } from '@/utils/path'
import { cover_setting } from '@/composables/cover_setting'

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

const cover_src = ref('')
const images = computed(() => status.nodes[TREE.IMAGE]?.children ?? [])

const selections = ref([...images.value ? images.value.map(_ => false) : []])
let si = -1

function seletct_cover(img: FileNode, i: number) {
    if (status.has_src(img.id)) {
        cover_src.value = status.image_srces[img.id]
    } else {
        cover_src.value = convertFileSrc(status.base_path + img.id)
        status.image_srces[img.id] = cover_src.value
    }
    selections.value.fill(false)
    selections.value[i] = true
    si = i
}
function clean_selections() {
    cover_src.value = ''
    selections.value.fill(false)
}
function set_cover() {
    const img = images.value[si]
    if (img) {
        const id = img.id
        status.set_cover(id)
    }
    cover_setting.value = false
}
async function open_cover() {
    const file = await open({
        title: '选择封面',
        filters: [
            { name: 'Image', extensions: ['jpg', 'png', 'svg', 'webp', 'avif', 'gif', 'ico', 'bmp', 'tif', 'tiff', 'svgz'] },
        ],
    })
    if (file) {
        const name = file.name!
        const path = status.manifest_path + status.image_path + name
        const node = status.nodes[TREE.IMAGE].children!.find(n => n.name === path)
        let has = false
        if (node) {
            has = true
        } else {
            status.add_image(path)
        }
        await status.add_file(file.path, name, status.image_path + name, mimetype(file.path), has)
        status.set_cover(status.manifest_path + status.image_path + name)
    } else {
        return
    }
    cover_setting.value = false
}

app_window.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
    invoke_clean_cache(status.dir).then(() => {
        app_window.destroy()
    })
})
</script>

<template>
  <q-page
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
          <SetMeta v-if="status.display === DISPLAY.METADATA" />
        </template>
      </q-splitter>
    </div>
    <q-dialog
      v-model="cover_setting"
      no-backdrop-dismiss
      no-shake
      shadow
      @hide="clean_selections"
    >
      <div 
        bg="var-eb-bg"
        text="var-eb-fg" 
        style="box-shadow:0 0 2px var(--eb-fg);"
        select-none
        w="80vw"
      >
        <q-bar>
          <div>设置封面</div>
          <q-space />

          <q-btn
            v-close-popup
            dense
            flat
            icon="close"
          />
        </q-bar>
        <div
          flex="~"
        >
          <q-scroll-area
            h="50vh"
            flex="1"
          >
            <template
              v-for="(img, i) in images"
              :key="img.id"
            >
              <div
                hover="bg-var-vscode-toolbar-hoverBackground"
                m="y-5"
                p="x-5"
                :class="{ selected: selections[i] }"
                @click="seletct_cover(img, i)"
              >
                {{ img.id }}
              </div>
            </template>
          </q-scroll-area>
          <q-scroll-area
            w="300"
            h="50vh"
          >
            <img
              v-show="cover_src !== ''"
              :src="cover_src"
              w="100%"
              obj-contain
              alt="cover"
            >
          </q-scroll-area>
        </div>
        <div
          class="q-gutter-md q-mx-sm" 
          bg="var-eb-bg"
          text="var-eb-fg"
          m="auto y-10 "
          w="fit"
        >
          <q-btn
            label="确定"
            @click="set_cover"
          />
          <q-btn
            label="取消"
            @click="cover_setting = false"
          />
          <q-btn
            m="l-50"
            label="打开文件"
            @click="open_cover"
          />
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.selected {
    background: var(--vscode-toolbar-activeBackground);
}
</style>
