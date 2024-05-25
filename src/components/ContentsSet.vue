<script setup lang="ts">
import { arr_move, arr_remove, clone_deep } from '@taiyuuki/utils'
import { useCloned } from '@vueuse/core'
import type { ContentsNode, FileNode } from './types'
import { useStatus } from '@/stores/status'
import { activity_contents } from '@/composables/useActivity'
import { contents_setting } from '@/composables/contents_setting'
import { useTheme } from '@/stores/theme'
import { TREE } from '@/static'

const status = useStatus()
const theme = useTheme()
const { cloned, sync } = useCloned(status.contents_tree, { clone: clone_deep })
const contents_edit = ref(false)
let editting_node: ContentsNode | null = null

let selected_dirty_node: ContentsNode | null = null
function select_contents(node: ContentsNode) {
    if (selected_dirty_node) {
        selected_dirty_node.selected = false
    }
    node.selected = true
    selected_dirty_node = node
}

const selected_index = ref(-1)

function contents_up(node: ContentsNode) {
    const tree = node.parent?.children ?? cloned.value
    const index = tree.indexOf(node)
    if (index > 0) {
        arr_move(tree, index, index - 1)
    }
}
function contents_down(node: ContentsNode) {
    const tree = node.parent?.children ?? cloned.value
    const index = tree.indexOf(node)
    if (index < tree.length - 1) {
        arr_move(tree, index, index + 1)
    }
}
function contents_left(node: ContentsNode) {
    if (!node.parent) {
        return
    }
    const parent_tree = node.parent.parent?.children ?? cloned.value
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
        } else {
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
    const tree = node.parent?.children ?? cloned.value
    const index = tree.indexOf(node)
    if (index > 0) {
        arr_remove(tree, node)
        const parent = tree[index - 1]
        node.parent = parent
        if (parent.children) {
            parent.children.push(node)
        } else {
            parent.expanded = true
            parent.children = [node]
        }
    }
}

function contents_remove(node: ContentsNode) {
    const tree = node?.parent?.children ?? cloned.value
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
    sync()
}

function contents_move(derection: 'down' | 'left' | 'right' | 'up') {
    if (!selected_dirty_node) {
        return
    }
    const node = selected_dirty_node
    if (derection === 'up') {
        contents_up(node)
    } else if (derection === 'down') {
        contents_down(node)
    } else if (derection === 'left') {
        contents_left(node)
    } else if (derection === 'right') {
        contents_right(node)
    }
}

function save_contents() {
    if (selected_dirty_node) {
        selected_dirty_node.selected = false
        selected_dirty_node = null
    }
    status.contents_tree.length = 0
    status.contents_tree.push(...toRaw(cloned.value))
    status.save_contents()
    contents_setting.value = false
}

const editing_node = reactive({
    name: '',
    value: '',
})

function init_edit() {
    editing_node.name = ''
    editing_node.value = ''
    selected_index.value = -1
    editting_node = null
}

function edit_node(node?: ContentsNode) {
    if (node) {
        selected_index.value = status.nodes[TREE.HTML].children!.findIndex(n => n.id === node.id)
        editing_node.name = node.title
        editing_node.value = node.id
        contents_edit.value = true
        editting_node = node
    }
}

function select_node(node: FileNode, i: number) {
    selected_index.value = i
    editing_node.value = node.id
}

function save_node() {
    if (editting_node) {
        editting_node.title = editing_node.name
        editting_node.id = editing_node.value
        editting_node = null
    }
    contents_edit.value = false
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
      <q-bar>
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
        h="50vh"
      >
        <ContentsTree
          :contents="cloned"
          :edit="true"
          @open="select_contents"
          @remove="contents_remove"
          @up="contents_up"
          @down="contents_down"
          @left="contents_left"
          @right="contents_right"
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
          pst="abs l-150 t-70"
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
        />
        <q-btn
          pst="abs l-250 t-70"
          label="下方添加"
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
      <q-input
        v-model="editing_node.name"
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
          {{ editing_node.value }}
        </div>
      </q-field>
      <div m="t-10">
        选择目标
      </div>
      <q-scroll-area
        m="t-10"
        h="30vh"
        style="box-shadow: 0 0 2px var(--eb-fg);"
      >
        <template
          v-for="(node, i) in status.nodes[TREE.HTML].children"
          :key="node.id"
        >
          <div
            flex="~"
            items-center
            p="y-10"
            :class="{ selected: i === selected_index, hovered: true }"
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
          label="取消"
          @click="contents_edit = false"
        />
        <q-btn
          pst="abs r-10 b-10"
          label="确定"
          @click="save_node"
        />
      </div>
    </div>
  </q-dialog>
</template>

<style scoped>
.selected {
    background: var(--vscode-toolbar-activeBackground);
}
.hovered:hover {
    background: var(--vscode-toolbar-hoverBackground);
}
</style>
