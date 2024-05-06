<script setup lang="ts">
import Draggable from 'vuedraggable'
import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import { invoke_get_text } from '@/invoke'
import type { FileNode } from '@/components/types'
import { themes } from '@/editor/themes'
import type { Language } from '@/editor/shiki'
import { NOT_SUPPORTED_THEMES } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { useTags } from '@/stores/tag'
import { useCode }from '@/stores/code'
import { useScrollTop } from '@/stores/scroll-top'
import { useActivity } from '@/composables/useActivity'
import { useTree } from '@/stores/useTree'
import { is_text } from '@/utils'
import { get_scroll_top, scroll_top_to } from '@/editor'

const splitterModel = ref(300)
const supported_themes = themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t))
const theme = useTheme()
const tags = useTags()
const tree = useTree()
const code = useCode()
const scroll_top = useScrollTop()

// const lang = ref<Language>('html')
const languages: Language[] = ['html', 'css', 'javascript', 'json']

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
        scroll_top.add(activity_node.opened_node.id, line)
    }
    activity_node.open(node)
    activity_node.activate(node)
    activity_node.select(node)

    if (tags.has_code(node.id)) {
        code.value = tags.codes[node.id].code
        code.lang = tags.codes[node.id].lang
        scroll_top_to(scroll_top.get(node.id))

        return
    }

    if (is_text(node.name)) {
        invoke_get_text(node.name)
    }
}

function close_file(node: FileNode) {
    tags.remve_tag_by_id(node.id)
    if (node.open) {
        if (tags.nodes[0]) {
            activity_node.open(tags.nodes[0])
            code.value = tags.codes[tags.nodes[0].id].code
            code.lang = tags.codes[tags.nodes[0].id].lang
            scroll_top_to(scroll_top.get(tags.nodes[0].id))
        } else {
            code.value = ''
            code.lang = 'html'
        }
    }

}

listen('get_text', (event: Event<[string, Language, string]>) => {
    code.value = event.payload[0]
    code.lang = event.payload[1]
    const id = event.payload[2]
    tags.codes[id] = { code: code.value, lang: code.lang }
    scroll_top_to(scroll_top.get(id))
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
      <q-select
        v-model="code.lang"
        square
        outlined
        dense
        label="语言"
        popup-content-class="bg-var-eb-bg text-var-eb-fg"
        color="fg"
        :options="languages"
        :dark="theme.dark"
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
          >
            <draggable
              :list="tags.nodes"
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
          :language="code.lang"
          :code="code.value"
        />
      </template>
    </q-splitter>
  </q-page>
</template>
@/stores/scroll-top
