<script setup lang="ts">
import { shikiToMonaco } from '@shikijs/monaco'
import { useElementRef } from 'composables/useComp'
import type { HighlighterCore } from 'shiki/index.mjs'
import { create_controller } from '@/editor'
import { getLighter } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { set_opacity } from '@/utils'
import { useStatus } from '@/stores/status'
import { invoke_write_text } from '@/invoke'
import { check_xml } from '@/utils/xml'

const theme = useTheme()
const status = useStatus()

const editor = useElementRef()
const monaco_controller = create_controller()
let timeout_id = 0

monaco_controller.on_change_code(() => {
    if (status.is_toogle) {
        return
    } else {
        status.current.is_dirty = true
    }
    
    if (timeout_id) {
        clearTimeout(timeout_id)
    }
    timeout_id = window.setTimeout(() => {
        status.current.is_dirty = false
        const code = monaco_controller.get_code()
        if (code.trim() === '') {
            return
        }
        if (status.current.id.endsWith('.opf')) {
      
            if (!check_xml(code)) {
                return
            }
        }
        invoke_write_text(status.dir, status.current.id, code)
    }, 500)
})

monaco_controller.on_change_lang(() => {
    status.current.lang = monaco_controller.get_lang()
})

watch(() => status.current.code, () => {
    monaco_controller.set_code(status.current.code)
})

watch(() => status.current.lang, () => {
    monaco_controller.set_lang(status.current.lang)
})

let hightlighter: HighlighterCore
onMounted(async() => {

    const monaco = monaco_controller.create_monaco(editor.value)
    if (!hightlighter) {
        hightlighter = await getLighter()

        // @ts-expect-error shikiToMonaco forced import monaco from 'monaco-editor-core', but here is 'monaco-editor'.
        shikiToMonaco(hightlighter, monaco)
    }
    watch(() => theme.shiki, () => {
        monaco.editor.setTheme(theme.shiki)

        const theme_colors = hightlighter.getTheme(theme.shiki)

        theme.color = theme_colors.fg
        theme.background = theme_colors.bg
        theme.dark = theme_colors.type === 'dark'

        theme['list.activeBorder'] = theme_colors.fg
        theme['list.border'] = set_opacity(theme_colors.fg, 0.3)
        theme.setColor()
    }, { immediate: true })
})
</script>

<template>
  <div
    ref="editor"
    w="100%"
    h="100%"
    pst="abs inset-0"
  />
</template>
