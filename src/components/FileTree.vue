<script setup lang="ts">
import Draggable from 'vuedraggable'
import { open } from '@tauri-apps/plugin-dialog'
import type { FileNode, TreeProps } from './types'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { mimetype } from '@/utils/file'
import { is_image } from '@/utils/is'

const props = withDefaults(defineProps<TreeProps>(), { indent: 10 })
const theme = useTheme()

const next_indent = computed(() => {
    return props.indent + props.indent / props.level
})
const line_width = computed(() => {
    return `${props.indent * 2}px`
})
const status = useStatus()

function toggle(e: MouseEvent, node: FileNode) {
    if (e.button !== 0) {
        return
    }
    
    status.add_tab(node)
    status.open(node)
}

async function add_file() {
    const files = await open({
        multiple: true,
        filters: [{
            name: '图片',
            extensions: [
                'jpg',
                'png',
                'svg',
                'webp',
                'avif',
                'gif',
                'ico',
                'bmp',
                'tif',
                'tiff',
                'svgz',
            ],
        },
        {
            name: '字体',
            extensions: [
                'ttf',
                'otf',
                'woff',
                'woff2',
            ],
        },
        {
            name: '样式',
            extensions: [
                'css',
            ],
        },
        {
            name: 'HTML',
            extensions: [
                'html',
                'xhtml',
                'htm',
            ],
        }, 
        {
            name: '音频',
            extensions: [
                'mp3',
                'wav',
                'ogg',
                'flac',
                'aac',
                'wma',
                'ape',
            ],
        },
        {
            name: '视频',
            extensions: [
                'mp4',
                'mkv',
                'webm',
                'avi',
                'mov',
                'wmv',
            ],
        },
        {
            name: '全部',
            extensions: ['*'],
        }],
    })

    if (files) {
        for await (const file of files) {
            const name = file.name!
            const media_type = mimetype(name)
            await status.add_file(file.path, name, status.image_path + name, media_type)
            if (is_image(name)) {
                status.add_image(status.manifest_path + status.image_path + name)
            }
        }
        status.save_opf()
    }
}
</script>

<template>
  <draggable
    :list="files"
    animation="300"
    force-fallback
    item-key="id"
    draggable=".draggable"
    v-bind="{
      multiDrag: true,
      selectedClass: 'selected',
      multiDragKey: 'ctrl',
      avoidImplicitDeselect: true,
    }"
  >
    <template #item="{ element: node }">
      <q-list>
        <div :class="{ draggable: node.type === 'html' }">
          <q-menu
            context-menu
            :dark="theme.dark"
          >
            <q-list>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  删除
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  重命名
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
              >
                <q-item-section>
                  添加副本
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                @click="add_file"
              >
                <q-item-section>
                  添加文件
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <div
            hover="cursor-pointer bg-var-vscode-toolbar-hoverBackground"
            :class="{ selected: node.selected }"
            middle
            p="y-2"
            text="14"
            whitespace-nowrap
            select-none
            @mousedown="toggle($event, node)"
          >
            <div
              v-if="node.children"
              :class="node.expanded ? 'i-ic:outline-keyboard-arrow-down' : 'i-ic:outline-keyboard-arrow-right'"
              display-inline-block
              middle
              w="20"
              h="20"
              :style="`margin-left: ${indent}px`"
            />
            <div
              v-else
              display-inline-block
              w="20"
              h="20"
            />
            <div
              :class="node.icon"
              display-inline-block
              middle
              w="20"
              h="20"
              :style="`margin-left: ${node.children ? 0 : indent}px`"
            />
            {{ node.name }}
          </div>
          <div 
            v-if="node.children"
            v-show="node.expanded"
            :style="{ textIndent: `${indent}px` }"
            :class="{ 'folder': true, 'folder-not-active': !node.active, 'folder-active': node.active }"
          >
            <FileTree
              :files="node.children"
              :indent="next_indent"
              :level="level + 1"
            />
          </div>
        </div>
      </q-list>
    </template>
  </draggable>
</template>

<style>
div.selected {
  background-color: var(--vscode-toolbar-activeBackground);
}

div.selected:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
}

.folder {
  position: relative;
}

.folder::before {
  content: '';
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: v-bind(line_width);
  border-right: 1px solid;
}

.folder-not-active::before {
  border-color: var(--eb-border);
}

.folder-active::before {
  border-color: var(--eb-active-border);
}
</style>
