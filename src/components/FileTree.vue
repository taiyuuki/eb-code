<script setup lang="ts">
import Draggable from 'vuedraggable'
import { ask, open } from '@tauri-apps/plugin-dialog'
import { QInput } from 'quasar'
import { arr_remove } from '@taiyuuki/utils'
import type { FileNode, Moved, TreeProps } from './types'
import { useEPUB } from '@/stores/epub'
import { useTheme } from '@/stores/theme'
import { basename, filename, mimetype } from '@/utils/path'
import { is_audio, is_font, is_html, is_image, is_scripts, is_style, is_video } from '@/utils/is'
import { notif_negative, notif_warning } from '@/notif'
import { invoke_rename_file } from '@/invoke'
import { TREE } from '@/static'

const props = withDefaults(defineProps<TreeProps>(), { indent: 10 })
const theme = useTheme()

const link_style_dialog = ref(false)
const rn = ref('')

const next_indent = computed(() => {
    return props.indent + props.indent / props.level
})
const line_width = computed(() => {
    return `${props.indent * 2}px`
})
const epub = useEPUB()

function toggle(node: FileNode) {
    epub.open(node)
}

async function add_file(node: FileNode) {
    let extensions = []
    let name = '所有'
    if (node.name === 'Text' || node.type === 'html') {
        extensions = ['xhtml', 'html', 'htm']
        name = 'HTML'
    }
    else if (node.name === 'Styles' || node.type === 'style') {
        extensions = ['css']
        name = 'CSS'
    }
    else if (node.name === 'Images' || node.type === 'image') {
        extensions = ['jpg', 'png', 'svg', 'webp', 'avif', 'gif', 'ico', 'bmp', 'tif', 'tiff', 'svgz']
        name = '图片'
    }
    else if (node.name === 'Audio' || node.type === 'audio') {
        extensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma', 'ape']
        name = '音频'
    }
    else if (node.name === 'Video' || node.type === 'video') {
        extensions = ['mp4', 'webm', 'mkv', 'mpg', 'mpeg', 'm4v', 'mov', 'wmv', 'avi', '3gp', '3g2']
        name = '视频'
    }
    else if (node.name === 'Fonts' || node.type === 'font') {
        extensions = ['ttf', 'otf', 'woff', 'woff2']
        name = '字体'
    }
    else if (node.name === 'Scripts' || node.type === 'js') {
        extensions = ['js']
        name = '脚本'
    }
    else {
        extensions = ['*']
        name = '所有'
    }
    const files = await open({
        multiple: true,
        filters: [{
            name,
            extensions,
        }],
    })

    if (files) {
        for await (const file of files) {
            const manifest_id = file.name!
            const _name = manifest_id.toLowerCase()
            const media_type = mimetype(manifest_id)
            let has = false
            let asset_path = ''
            if (is_image(_name)) {
                asset_path = epub.image_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.IMAGE].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_image(file)
                }
            }
            else if (is_font(_name)) {
                asset_path = epub.font_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.FONT].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_font(file)
                }
            }
            else if (is_style(_name)) {
                asset_path = epub.style_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.STYLE].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_css(file)
                }
            }
            else if (is_html(_name)) {
                asset_path = epub.text_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.HTML].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_html(file)
                }
            }
            else if (is_audio(_name)) {
                asset_path = epub.audio_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.AUDIO].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_audio(file)
                }
            }
            else if (is_video(_name)) {
                asset_path = epub.video_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.VIDEO].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_video(file)
                }
            }
            else if (is_scripts(_name)) {
                asset_path = epub.script_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.JS].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_js(file)
                }

            }
            else {
                asset_path = epub.other_path
                const file = epub.manifest_path + asset_path + manifest_id
                const node = epub.nodes[TREE.OTHER].children!.find(n => n.name === file)
                if (node) {
                    has = true
                }
                else {
                    epub.add_other(file)
                }
            }
            epub.add_file(file.path, manifest_id, asset_path + manifest_id, media_type, has)
        }
        epub.save_opf()
    }
}

async function remove_file(node: FileNode) {
    const conf = await ask(`确定要删除 ${basename(node.name)} 吗？`, {
        title: '确认',
        okLabel: '是',
        cancelLabel: '取消',
    })
    if (!conf) {
        return
    }
    if (node.id.endsWith('.opf')) {
        notif_warning('不允许删除 opf 文件。')

        return
    }
    epub.remove_file(node)
}

function show_base_menu(node: FileNode) {
    return !node.id.endsWith('.opf') && !node.id.endsWith('.ncx') && node.type !== 'navigation' && node.type !== 'folder'
}

function show_new_html(node: FileNode) {
    return node.type === 'html' || node.id === 'text' || node.type === 'navigation' && epub.nav_in_spine
}

function show_new_css(node: FileNode) {
    return node.type === 'css' || node.id === 'styles' 
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
            }
            else {
                const id = temp_node.id.replace(name, rn.value)
                if (parent.children!.some(n => n.id === id)) {
                    notif_warning('不能与已有文件重名！')
                    _rinput.value?.focus()
                    _rinput.value?.select()

                    return
                }
                else {
  
                    invoke_rename_file(epub.dir, temp_node.id, id).then(() => {
                      
                        epub.rename_file(temp_node, id.replace(epub.manifest_path, ''))
                        temp_node.id = id
                        temp_node.name = id
                        parent.children![temp_i] = temp_node
                    }, () => {
                        notif_negative('缓存文件被删除，请重新打开EPUB！')
                    })
                }
            }
        }
        else{
            turn_back()
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

function add_nav_to_spine(node: FileNode) {
    if (epub.nav_in_spine) {
        epub.nodes.push(node)
        arr_remove(epub.nodes[0].children!, node)
    }
    else {
        arr_remove(epub.nodes, node)
        epub.nodes[0].children!.unshift(node)
    }
    epub.nav_in_spine = !epub.nav_in_spine
    epub.add_nav_to_spine()
}

function change(e: { moved: Moved }) {
    const { moved } = e

    epub.move(moved.oldIndex, moved.newIndex)
}

function set_cover(node: FileNode) {
    epub.set_cover(node.id)
}

let hi = 1
function new_html(i: number) {
    let html_file_name = `${epub.manifest_path}${epub.text_path}Section${hi.toString().padStart(4, '0')}.xhtml`
    while (epub.nodes[TREE.HTML].children!.some(n => n.id === html_file_name)) {
        hi++
        html_file_name = `${epub.manifest_path}${epub.text_path}Section${hi.toString().padStart(4, '0')}.xhtml`
    }
    epub.new_html(i, html_file_name)
}

let si = 1
function new_css() {
    let style_file_name = `${epub.manifest_path}${epub.style_path}Style${si.toString().padStart(4, '0')}.css`
    while (epub.nodes[TREE.STYLE].children!.some(n => n.id === style_file_name)) {
        si++
        style_file_name = `${epub.manifest_path}${epub.style_path}Style${si.toString().padStart(4, '0')}.css`
    }
    epub.new_css(style_file_name)
}

const to_node = ref<FileNode | null>(null)
async function link_to_style(node: FileNode) {
    link_style_dialog.value = true
    to_node.value = node
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
    @change="change"
  >
    <template #item="{ element: node, index: i }">
      <div :class="{ draggable: node.type === 'html' || node.type === 'navigation' && epub.nav_in_spine }">
        <q-menu
          context-menu
        >
          <q-list>
            <q-item
              v-if="show_new_html(node)"
              v-close-popup
              clickable
              @click="new_html(i)"
            >
              <q-item-section>
                新建空白文档
              </q-item-section>
            </q-item>
            <q-item
              v-if="show_new_css(node)"
              v-close-popup
              clickable
              @click="new_css"
            >
              <q-item-section>
                新建空白样式
              </q-item-section>
            </q-item>
            <q-item
              v-if="is_html(node.id)"
              v-close-popup
              clickable
              @click="link_to_style(node)"
            >
              <q-item-section>
                链接样式文件
              </q-item-section>
            </q-item>
            <q-item
              v-if="show_base_menu(node)"
              v-close-popup
              clickable
              @click="remove_file(node)"
            >
              <q-item-section>
                删除
              </q-item-section>
            </q-item>
            <q-item
              v-if="show_base_menu(node)"
              v-close-popup
              clickable
              @click="rename(node, i)"
            >
              <q-item-section>
                重命名
              </q-item-section>
            </q-item>
            <template v-if="node.type === 'navigation' && node.id.endsWith('html')">
              <q-item
                v-close-popup
                clickable
                @click="add_nav_to_spine(node)"
              >
                <q-item-section>
                  {{ epub.nav_in_spine ? '移出书脊' : '添加到书脊' }}
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                @click="epub.gen_ncx_for_epub2"
              >
                <q-item-section>
                  为ePub2生成NCX和GUIDE
                </q-item-section>
              </q-item>
            </template>
            <q-item
              v-close-popup
              clickable
              @click="add_file(node)"
            >
              <q-item-section>
                添加文件
              </q-item-section>
            </q-item>

            <q-separator v-if="node.type === 'image'" />

            <q-item
              v-if="node.type === 'image'"
              v-close-popup
              clickable
              @click="set_cover(node)"
            >
              <q-item-section>
                设为封面
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <FileItem
          v-if="node.icon"
          :node="node"
          :level="level"
          :indent="indent"
          @toggle="toggle"
        />
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
    </template>
  </draggable>
  <q-dialog
    v-model="link_style_dialog"
    no-shake
    no-backdrop-dismiss
  >
    <template v-if="to_node">
      <Suspense>
        <StyleLink
          :node="to_node"
          @complate="link_style_dialog = false"
        />
      </Suspense>
    </template>
  </q-dialog>
</template>

<style scoped>
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
  border-color: var(--vscode-checkbox-border);
}

.folder-active::before {
  border-color: var(--vscode-checkbox-selectBorder);
}
</style>
@/utils/path
