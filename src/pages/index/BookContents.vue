<script setup lang="ts">
import { arr_move, arr_remove, clone_deep } from '@taiyuuki/utils'
import { useStatus } from '@/stores/status'
import { activity_contents } from '@/composables/useActivity'
import type { ContentsNode } from '@/components/types'

const status = useStatus()

const dirty_contents = reactive(clone_deep(toRaw(status.contents_tree)))
const contents_set = ref(true)

let selected_dirty_node: ContentsNode | null = null

function select(node: ContentsNode) {
    if (selected_dirty_node) {
        selected_dirty_node.selected = false
    }
    node.selected = true
    selected_dirty_node = node
}

function open(node: ContentsNode) {
    if (activity_contents.selected_node) {
        activity_contents.selected_node.selected = false
    }

    activity_contents.selected_node = node
    activity_contents.selected_node.selected = true

    // TODO: 跳转至id，当前做法是直接删除id
    const i = node.id.lastIndexOf('#')
    let id = node.id
    if (i > 0) {
        id = node.id.substring(0, node.id.indexOf('#'))
    }
    status.open_by_id(id)
}

function contents_up(node: ContentsNode) {
    const tree = node.parent?.children ?? dirty_contents
    const index = tree.indexOf(node)
    if (index > 0) {
        arr_move(tree, index, index - 1)
    }
}
function contents_down(node: ContentsNode) {
    const tree = node.parent?.children ?? dirty_contents
    const index = tree.indexOf(node)
    if (index < tree.length - 1) {
        arr_move(tree, index, index + 1)
    }
}
function contents_left(node: ContentsNode) {
    if (!node.parent) {
        return
    }
    const parent_tree = node.parent.parent?.children ?? dirty_contents
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
    const tree = node.parent?.children ?? dirty_contents
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

function contents_remove() {
    if (selected_dirty_node) {
        const tree = selected_dirty_node.parent?.children ?? dirty_contents
        arr_remove(tree, selected_dirty_node)
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
</script>

<template>
  <q-scroll-area
    style="height: calc(100vh - 115px);"
  >
    <ContentsTree
      :contents="status.contents_tree"
      @open="open"
    />
  </q-scroll-area>
  <q-dialog
    v-model="contents_set"
    no-shake
    @hide="on_hide"
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
          :contents="dirty_contents"
          @open="select"
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
          pst="abs l-150 t-60"
          label="删除"
          @click="contents_remove"
        />
        <q-btn
          pst="abs l-150 t-20"
          label="编辑"
        />
        <q-btn
          pst="abs l-230 t-20"
          label="上方添加"
        />
        <q-btn
          pst="abs l-230 t-60"
          label="下方添加"
        />
        <q-btn
          pst="abs r-80 b-10"
          label="确定"
        />
        <q-btn
          pst="abs r-10 b-10"
          label="取消"
        />
      </div>
    </div>
  </q-dialog>
</template>
