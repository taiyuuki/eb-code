<script setup lang="ts">
import Draggable from 'vuedraggable'
import type { FileNode } from '@/components/types'
import { themes } from '@/editor/themes'
import type { Language } from '@/editor/shiki'
import { NOT_SUPPORTED_THEMES } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { useTags } from '@/stores/tag'
import { useActivity } from '@/composables/useActivity'

const splitterModel = ref(300)
const supported_themes = themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t))
const theme = useTheme()

const lang = ref<Language>('html')
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

// const tag_nodes = ref<FileNode[]>([])
const tags = useTags()
const active_node = useActivity()

// TODO:删除下面这些测试代码
const files = ref([
    {
        id: '1', 
        name: 'Text', 
        icon: 'i-vscode-icons:folder-type-view-opened',
        children: [
            {
                id: '1-1',
                name: '1-1.html',
                icon: 'i-vscode-icons:file-type-html',
                children: [
                    {
                        id: '1-1-1',
                        name: '1-1-1.css',
                        icon: 'i-vscode-icons:file-type-css',
                        children: [
                            {
                                id: '1-1-1-1',
                                name: '1-1-1-1.html',
                                icon: 'i-vscode-icons:file-type-html',
                                children: [
                                    { id: '1-1-1-1-1', name: 'index.css', icon: 'i-vscode-icons:file-type-css' },
                                ], 
                            },
                            {
                                id: '1-1-1-2',
                                name: '1-1-1-2.html',
                                icon: 'i-vscode-icons:file-type-html',
                            },
                        ], 
                    },
                ], 
            },
            {
                id: '1-2',
                name: '1-2.html',
                icon: 'i-vscode-icons:file-type-html',
            },
        ],
    },
    {
        id: '2',
        name: 'style',
        icon: 'i-vscode-icons:folder-type-css',
        children: [
            { id: '2-1', name: '2-1.css', icon: 'i-vscode-icons:file-type-css' },
            { id: '2-2', name: '2-2.css', icon: 'i-vscode-icons:file-type-css' },
        ], 
    },
    {
        id: '3',
        name: 'fonts',
        icon: 'i-vscode-icons:folder-type-fonts',
        children: [
            { id: '3-1', name: '3-1.ttf', icon: 'i-vscode-icons:file-type-font' },
            { id: '3-2', name: '22222222222222.ttf', icon: 'i-vscode-icons:file-type-font' },
        ],
    },
    {
        id: '4',
        name: 'images',
        icon: 'i-vscode-icons:folder-type-images',
        children: [
            { id: '4-1', name: '4-1.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-2', name: '4-2.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-3', name: '4-3.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-4', name: '4-4.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-5', name: '4-5.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-6', name: '4-6.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-7', name: '4-7.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-8', name: '4-8.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-9', name: '4-9.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-10', name: '4-10.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-11', name: '4-11.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-12', name: '4-12.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-13', name: '4-13.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-14', name: '4-14.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-15', name: '4-15.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-16', name: '4-16.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-17', name: '4-17.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-18', name: '4-18.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-19', name: '4-19.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-20', name: '4-20.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-21', name: '4-21.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-22', name: '4-22.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-23', name: '4-23.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-24', name: '4-24.png', icon: 'i-vscode-icons:file-type-image' },
            { id: '4-25', name: '4-25.png', icon: 'i-vscode-icons:file-type-image' },
        ],
    },
])

// 给 files 每个节点添加父节点
const addParent = (file: FileNode) => {
    if (file.children) {
        file.children.forEach(child => {
            child.parent = file
            addParent(child)
        })
    }
}
files.value.forEach(node => {
    addParent(node)
})

function open_file(node: FileNode) {
    active_node.open(node)
    active_node.activate(node)
    active_node.select(node)
}

function close_file(node: FileNode) {
    tags.remve_tag_by_id(node.id)
    if (node.open) {
        tags.nodes[0] && active_node.open(tags.nodes[0])
    }
}
</script>

<template>
  <q-page
    class="monaco-component"
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
        v-model="lang"
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
          style="height: calc(100vh - 100px);"
          :thumb-style="thumb_style"
        >
          <FileTree
            :files="files"
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
          :language="lang"
          code=""
        />
      </template>
    </q-splitter>
  </q-page>
</template>
