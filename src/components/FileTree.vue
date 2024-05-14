<script setup lang="ts">
import Draggable from 'vuedraggable'
import { open } from '@tauri-apps/plugin-dialog'
import { QInput } from 'quasar'
import type { FileNode, TreeProps } from './types'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { filename, mimetype } from '@/utils/file'
import { is_audio, is_font, is_html, is_image, is_style, is_video } from '@/utils/is'
import { notif_negative, notif_warning } from '@/notif'
import { invoke_rename_file } from '@/invoke'

const props = withDefaults(defineProps<TreeProps>(), { indent: 10 })
const theme = useTheme()

const rn = ref('')

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
            const _name = name.toLowerCase()
            const media_type = mimetype(name)
            let asset_path = ''
            if (is_image(_name)) {
                asset_path = status.image_path
                status.add_image(status.manifest_path + asset_path + name)
            } else if (is_font(_name)) {
                asset_path = status.font_path
                status.add_font(status.manifest_path + asset_path + name)
            } else if (is_style(_name)) {
                asset_path = status.style_path
                status.add_css(status.manifest_path + asset_path + name)
            } else if (is_html(_name)) {
                asset_path = status.text_path
                status.add_html(status.manifest_path + asset_path + name)
            } else if (is_audio(_name)) {
                asset_path = status.audio_path
                status.add_audio(status.manifest_path + asset_path + name)
            } else if (is_video(_name)) {
                asset_path = status.video_path
                status.add_video(status.manifest_path + asset_path + name)
            } else{
                asset_path = status.other_path
                status.add_other(status.manifest_path + asset_path + name)
            }
            await status.add_file(file.path, name, asset_path + name, media_type)
        }
        status.save_opf()
    }
}

function remove_file(node: FileNode) {
    if (node.id.endsWith('.opf')) {
        notif_warning('不允许删除 opf 文件。')

        return
    }
    status.remove_file(node)
}

function show_menu(node: FileNode) {
    return node.type !== 'folder'
}

function show_remove(node: FileNode) {
    return !node.id.endsWith('.opf')
}

const _rinput = ref()
let temp_node: FileNode
let temp_i = -1
function rename(node: FileNode, i: number) {
    const parent = node.parent
    if (parent) {
        temp_node = parent.children![i]
        temp_i = i
        rn.value = filename(node.id)
        parent.children![i] = reactive({
            id: filename(node.id),
            name: filename(node.id),
        })
    }
    nextTick(() => {
        _rinput.value?.focus()
        _rinput.value?.select()
    })
}
function turn_back() {
    const parent = temp_node.parent
    if (parent) {
        parent.children![temp_i] = temp_node
    }
}
function rename_over() {
    const parent = temp_node.parent
    if (parent) {
        const name = filename(temp_node.id)
        if (rn.value.trim() && name !== rn.value) {
            const reg = new RegExp('[\\\\/:*?"<>|]')
            if (reg.test(rn.value)) {
                notif_warning('文件名包含非法字符')
                _rinput.value?.focus()
                _rinput.value?.select()

                return
            } else {
                const id = temp_node.id.replace(name, rn.value)
                if (parent.children!.some(n => n.id === id)) {
                    notif_warning('不能与已有文件重名！')
                    _rinput.value?.focus()
                    _rinput.value?.select()

                    return
                } else {
  
                    invoke_rename_file(status.dir, temp_node.id, id).then(() => {
                      
                        status.rename_file(temp_node, id.replace(status.manifest_path, ''))
                        temp_node.id = id
                        temp_node.name = id
                        parent.children![temp_i] = temp_node
                    }, () => {
                        notif_negative('缓存文件被删除，请重新打开EPUB！')
                    })
                }
            }
        }
    }
}

function on_keypress(e: KeyboardEvent) {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        rename_over()
    }
    if (e.code === 'Escape') {
        turn_back()
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
    <template #item="{ element: node, index: i }">
      <q-list>
        <div :class="{ draggable: node.type === 'html' }">
          <q-menu
            v-if="show_menu(node)"
            context-menu
            :dark="theme.dark"
            bg="var-eb-bg"
            text="var-eb-fg"
          >
            <q-list>
              <q-item
                v-show="show_remove(node)"
                v-close-popup
                clickable
                @click="remove_file(node)"
              >
                <q-item-section>
                  删除
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                @click="rename(node, i)"
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
            v-if="node.icon"
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
            v-else
            m="l-60 r-20" 
            @keydown="on_keypress"
          >
            <q-input
              ref="_rinput"
              v-model="rn"
              outlined
              autofocus
              middle
              dense
              :dark="theme.dark"
              @blur="rename_over"
            />
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

<style scoped>
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
