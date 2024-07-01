<script setup lang="ts">
import { arr_move, arr_remove, clone_deep } from '@taiyuuki/utils'
import { useCloned } from '@vueuse/core'
import type { ContentsNode, FileNode } from './types'
import { useEPUB } from '@/stores/epub'
import { activity_contents } from '@/composables/useActivity'
import { contents_setting } from '@/composables/contents_setting'
import { useTheme } from '@/stores/theme'
import { TREE } from '@/static'
import { notif_warning } from '@/notif'
import { vScrollview } from '@/directives/v-scrollview'
import { vMove } from '@/directives/v-move'
import { invoke_gen_contents } from '@/invoke'

const epub = useEPUB()
const theme = useTheme()
const { cloned: dirty_contents, sync } = useCloned(epub.contents_tree, { clone: clone_deep })
const contents_edit = ref(false)
let editting_node: ContentsNode | null = null
let selected_dirty_node: ContentsNode | null = null
const confirm_type = ref<'after' | 'before' | null>(null)
const filter_target = ref('')
let replacement: Record<string, [string, string][]> | null = null

function select_contents(node: ContentsNode) {
    if (selected_dirty_node) {
        selected_dirty_node.selected = false
    }
    node.selected = true
    selected_dirty_node = node
}

const selected_index = ref(-1)

function contents_up(node: ContentsNode) {
    const tree = node.parent?.children ?? dirty_contents.value
    const index = tree.indexOf(node)
    if (index > 0) {
        arr_move(tree, index, index - 1)
    }
}
function contents_down(node: ContentsNode) {
    const tree = node.parent?.children ?? dirty_contents.value
    const index = tree.indexOf(node)
    if (index < tree.length - 1) {
        arr_move(tree, index, index + 1)
    }
}
function contents_left(node: ContentsNode) {
    if (!node.parent) {
        return
    }
    const parent_tree = node.parent.parent?.children ?? dirty_contents.value
    const current_tree = node.parent.children!
    const ci = current_tree.indexOf(node)
    if (ci >= 0) {
        const afters = current_tree.splice(ci + 1, current_tree.length - 1)
        if (node.parent.children!.length === 0) {
            node.parent.children = undefined
        }
        afters.forEach(n => {
            n.parent = node
        })
        if (node.children) {
            node.children.push(...afters)
        }
        else {
            node.expanded = true
            node.children = afters
        }
        const pi = parent_tree.indexOf(node.parent)
        arr_remove(current_tree, node)
        node.parent = parent_tree[pi].parent
        parent_tree.splice(pi + 1, 0, node)
    }  
}

function contents_right(node: ContentsNode) {
    const tree = node.parent?.children ?? dirty_contents.value
    const index = tree.indexOf(node)
    if (index > 0) {
        arr_remove(tree, node)
        const parent = tree[index - 1]
        node.parent = parent
        if (parent.children) {
            parent.children.push(node)
        }
        else {
            parent.expanded = true
            parent.children = [node]
        }
    }
}

function contents_remove(node: ContentsNode) {
    const tree = node?.parent?.children ?? dirty_contents.value
    arr_remove(tree, node)
    if (selected_dirty_node && selected_dirty_node === node) {
        selected_dirty_node.selected = false
        selected_dirty_node = null
    }
}

function on_hide() {
    if (selected_dirty_node) {
        selected_dirty_node.selected = false
        selected_dirty_node = null
    }
}

function on_show() {
    if (activity_contents.selected_node) {
        activity_contents.selected_node.selected = false
        activity_contents.selected_node = null
    }
    epub.load_contents_link()
    sync()
}

function contents_move(derection: 'down' | 'left' | 'right' | 'up') {
    if (!selected_dirty_node) {
        return
    }
    const node = selected_dirty_node
    if (derection === 'up') {
        contents_up(node)
    }
    else if (derection === 'down') {
        contents_down(node)
    }
    else if (derection === 'left') {
        contents_left(node)
    }
    else if (derection === 'right') {
        contents_right(node)
    }
}

async function save_contents() {
    if (selected_dirty_node) {
        selected_dirty_node.selected = false
        selected_dirty_node = null
    }
    if (replacement && Object.keys(replacement).length > 0) {
        await invoke_gen_contents(epub.dir, replacement).finally(() => {
            replacement = null
        })
        await epub.load_contents_link()
    }
    epub.contents_tree.length = 0
    epub.contents_tree.push(...toRaw(dirty_contents.value))
    epub.save_contents()
    contents_setting.value = false
}

const input_value = reactive({
    name: '',
    value: '',
})

function init_edit() {
    input_value.name = ''
    input_value.value = ''
    selected_index.value = -1
    editting_node = null
    filter_target.value = ''
}

function edit_node(node?: ContentsNode) {
    if (node) {
        selected_index.value = epub.nodes[TREE.HTML].children!.findIndex(n => n.id === node.id)
        input_value.name = node.title
        input_value.value = node.id
        contents_edit.value = true
        editting_node = node
    }
}

function select_node(node: FileNode, i: number) {
    selected_index.value = i
    input_value.value = node.id
}

function save_node() {
    if (input_value.name.trim() === '') {
        notif_warning('请输入标题')

        return
    }
    if (input_value.value.trim() === '') {
        notif_warning('请选择链接目标')

        return
    }

    if (selected_dirty_node) {
        if (confirm_type.value) {
            const tree = selected_dirty_node.parent?.children ?? dirty_contents.value
            const index = tree.indexOf(selected_dirty_node)

            if (index >= 0) {
                const new_node: ContentsNode = {
                    id: input_value.value,
                    title: input_value.name,
                    selected: true,
                    parent: selected_dirty_node.parent,
                }
                selected_dirty_node.selected = false
                
                switch (confirm_type.value) {
                    case 'before':
                        tree.splice(index, 0, new_node)
                        selected_dirty_node = tree[index]
                        break
                    case 'after':
                        tree.splice(index + 1, 0, new_node)
                        selected_dirty_node = tree[index + 1]
                        break
                    default:
                        break
                }
                confirm_type.value = null
            }
        }
        else if (editting_node) {
            selected_dirty_node.title = input_value.name
            editting_node.id = input_value.value
        }
    }
    else {
        const new_node: ContentsNode = {
            id: input_value.value,
            title: input_value.name,
            selected: true,
        }
        switch (confirm_type.value) {
            case 'before':
                dirty_contents.value.unshift(new_node)
                selected_dirty_node = dirty_contents.value[0]
                break
            case 'after':
                dirty_contents.value.push(new_node)
                selected_dirty_node = dirty_contents.value[dirty_contents.value.length - 1]
                break
            default:
                break
        }
    }
    contents_edit.value = false
}

function insert_before(node?: ContentsNode) {
    if (node) {
        selected_dirty_node = node
    }
    input_value.name = ''
    input_value.value = ''
    confirm_type.value = 'before'
    contents_edit.value = true
}

function insert_after(node?: ContentsNode) {
    if (node) {
        selected_dirty_node = node
    }
    input_value.name = ''
    input_value.value = ''
    confirm_type.value = 'after'
    contents_edit.value = true
}

async function gen_contents() {
    const headers = await epub.get_contents_header()
    dirty_contents.value = headers.nodes
    replacement = headers.replacement
}
</script>

<template>
  <q-dialog
    v-model="contents_setting"
    no-shake
    no-backdrop-dismiss
    @hide="on_hide"
    @show="on_show"
  >
    <div
      bg="var-eb-bg"
      text="var-eb-fg" 
      select-none
      style="box-shadow:0 0 2px var(--eb-fg);"
      w="80vw"
    >
      <q-bar v-move>
        <div>目录编辑</div>
        <q-space />

        <q-btn
          v-close-popup
          dense
          flat
          icon="close"
        />
      </q-bar>
      <q-scroll-area
        visible
        h="50vh"
      >
        <ContentsTree
          :contents="dirty_contents"
          :edit="true"
          @open="select_contents"
          @edit="edit_node"
          @remove="contents_remove"
          @up="contents_up"
          @down="contents_down"
          @left="contents_left"
          @right="contents_right"
          @add_up="insert_before"
          @add_down="insert_after"
          @contextmenu="select_contents"
        />
      </q-scroll-area>
      <div
        pst="rel"
        h="120"
        p="10"
      >
        <q-btn
          class="i-ic:outline-arrow-circle-up"
          pst="abs l-50 t-10"
          @click="contents_move('up')"
        />
        <q-btn
          class="i-ic:outline-arrow-circle-down"
          pst="abs l-50 t-70"
          @click="contents_move('down')"
        />
        <q-btn
          class="i-ic:outline-arrow-circle-left"
          pst="abs l-20 t-40"
          @click="contents_move('left')"
        />
        <q-btn
          class="i-ic:outline-arrow-circle-right"
          pst="abs l-80 t-40"
          @click="contents_move('right')"
        />
        <q-btn
          pst="abs l-150 b-10"
          label="删除选中"
          @click="contents_remove(selected_dirty_node!)"
        />
        <q-btn
          pst="abs l-150 t-20"
          label="编辑选中"
          @click="edit_node(selected_dirty_node!)"
        />
        <q-btn
          pst="abs l-250 t-20"
          label="上方添加"
          @click="insert_before()"
        />
        <q-btn
          pst="abs l-250 b-10"
          label="下方添加"
          @click="insert_after()"
        />
        <q-btn
          pst="abs r-10 t-20"
          label="生成目录"
          @click="gen_contents"
        />
        <q-btn
          pst="abs r-80 b-10"
          label="确定"
          @click="save_contents"
        />
        <q-btn
          pst="abs r-10 b-10"
          label="取消"
          @click="contents_setting = false"
        />
      </div>
    </div>
  </q-dialog>
  <q-dialog
    v-model="contents_edit"
    no-shake
    @hide="init_edit"
  >
    <div
      bg="var-eb-bg"
      text="var-eb-fg"
      p="10"
      select-none
      style="box-shadow:0 0 2px var(--eb-fg);"
      w="80vw"
    >
      <q-bar
        v-move
        m="-10 b-10"
      >
        <div>选择目标</div>
      </q-bar>
      <q-input
        v-model="input_value.name"
        dense
        outlined
        label="标题"
        :dark="theme.dark"
        m="t-10"
      />
      <q-field
        outlined
        dense
        label="目标"
        stack-label
        :dark="theme.dark"
        m="t-10"
        readonly
      >
        <div
          tabindex="0"
          m="t-10"
        >
          {{ input_value.value }}
        </div>
      </q-field>
      <q-input
        v-model="filter_target"
        dense
        outlined
        label="筛选"
        class="m-t-10"
        :dark="theme.dark"
      />
      <q-scroll-area
        visible
        m="t-10"
        h="35vh"
        style="box-shadow: 0 0 2px var(--eb-fg);"
      >
        <template
          v-for="(node, i) in epub.contents_links"
          :key="node.id"
        >
          <div
            v-show="filter_target === '' || node.id.includes(filter_target)"
            v-scrollview="i === selected_index"
            flex="~"
            items-center
            p="y-10"
            :class="{ 'list-selection': true, 'selected': i === selected_index }"
            @click="select_node(node, i)"
          >
            {{ node.id }}
          </div>
        </template>
      </q-scroll-area>
      <div
        pst="rel"
        h="120"
        p="10"
      >
        <q-btn
          pst="abs r-80 b-10"
          label="确定"
          @click="save_node"
        />
        <q-btn
          pst="abs r-10 b-10"
          label="取消"
          @click="contents_edit = false"
        />
      </div>
    </div>
  </q-dialog>
</template>
