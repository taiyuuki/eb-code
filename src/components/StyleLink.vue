<script setup lang="ts">
import type { FileNode } from './types'
import { invoke_get_text, invoke_write_text } from '@/invoke'
import { notif_negative } from '@/notif'
import { DISPLAY, TREE } from '@/static'
import { useStatus } from '@/stores/status'
import { relative } from '@/utils/path'
import { domToXml, xmlToDom } from '@/utils/xml'
import { usePreview } from '@/stores/preview'
import { vMove } from '@/directives/v-move'

const props = defineProps<{ node: FileNode }>()
const emit = defineEmits<{ (e: 'complate'): void }>()

const status = useStatus()
const preview = usePreview()
const checks = ref(Array.from<boolean>({ length: status.nodes[TREE.STYLE].children!.length }).fill(false))

const [code, _] = await invoke_get_text(props.node.id, status.dir)
const dom = xmlToDom(code)
const head = dom.querySelector('head')

checks.value.forEach((_, i) => {
    const style_node = status.nodes[TREE.STYLE].children![i]
    const href = relative(style_node.id, props.node.id)
    const link = dom.querySelector(`link[href="${href}"]`)
    if (link) {
        checks.value[i] = true
    }
})
async function link_to_style() {
    if (!head) {
        notif_negative('链接失败！此文件不是规范的xhtml文件！')

        return
    }
    const links = head.querySelectorAll('link')
    links.forEach(link => {
        head.removeChild(link)
    })
    checks.value.forEach((check, i) => {
        if (!check) {
            return
        }
        const style_node = status.nodes[TREE.STYLE].children![i]
        const href = relative(style_node.id, props.node.id)
        const link = dom.querySelector(`link[href="${href}"]`)
        if (!link) {
            const new_link = document.createElementNS(dom.documentElement.namespaceURI, 'link')
            new_link.setAttribute('href', href)
            new_link.setAttribute('rel', 'stylesheet')
            new_link.setAttribute('type', 'text/css')
            head?.appendChild(new_link)
            head?.appendChild(document.createTextNode('\n'))
        }
    })
    await invoke_write_text(status.dir, props.node.id, domToXml(dom).replace(/\n\s*\n\s*\n/g, '\n\n'))
    if (status.current.id === props.node.id) {
        if (status.display === DISPLAY.CODE) {
            await status.reload_current()
        }
        preview.reload_iframe()
    }
    emit('complate')
}
</script>

<template>
  <div
    bg="var-eb-bg"
    text="var-eb-fg"
    w="80vw"
    select-none
  >
    <q-bar v-move>
      <div>链接样式文件</div>
      <q-space />

      <q-btn
        v-close-popup
        dense
        flat
        icon="close"
      />
    </q-bar>
    <q-scroll-area h="50vh">
      <div
        v-for="(css, i) in status.nodes[TREE.STYLE].children"
        :key="css.id"
      >
        <q-checkbox
          v-model="checks[i]"
          size="xs"
          :label="css.id"
        />
      </div>
    </q-scroll-area>
    <div
      pst="rel"
      p="10"
      h="80"
    >
      <q-btn
        pst="abs r-80 b-10"
        label="确定"
        @click="link_to_style"
      />
      <q-btn
        pst="abs r-10 b-10"
        label="取消"
        @click="emit('complate')"
      />
    </div>
  </div>
</template>
