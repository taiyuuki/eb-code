<script setup lang="ts">
import { shikiToMonaco } from '@shikijs/monaco'
import { useElementRef } from 'composables/useComp'
import type { HighlighterCore } from 'shiki/index.mjs'
import { create_controller } from '@/editor'
import { getLighter } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { useEPUB } from '@/stores/epub'
import { invoke_write_text } from '@/invoke'
import { check_xml } from '@/utils/xml'
import { useActivity } from '@/composables/useActivity'
import { SAVE_DELAY } from '@/static'
import { usePreview } from '@/stores/preview'
import { is_html, is_style } from '@/utils/is'

const theme = useTheme()
const epub = useEPUB()

const editor = useElementRef()
const monaco_controller = create_controller()
const activity_node = useActivity()
let timeout_id = 0
const preview = usePreview()

monaco_controller.on_change_code(() => {
    if (epub.is_toogle) {
        epub.is_toogle = false

        return
    } 
    
    if (timeout_id) {
        clearTimeout(timeout_id)
    }
    
    timeout_id = window.setTimeout(() => {
        const code = monaco_controller.get_code()

        if (code.trim() === '') {
            return
        }

        if (epub.current.id.endsWith('.opf')) {
      
            if (!check_xml(code)) {
                return
            }

            epub.reload_opf().then(() => {
                epub.parse_metadata()
            })
        }

        if (activity_node.opened_node?.type === 'navigation') {
            if (epub.current.id.endsWith('.ncx') && !check_xml(code)) {
                return
            }
            epub.parse_contents()
        }

        invoke_write_text(epub.dir, epub.current.id, code).then(() => {
            if (is_html(epub.current.id) || is_style(epub.current.id)) {
                preview.reload_iframe()
            }
        })
    }, SAVE_DELAY)
})

monaco_controller.on_change_lang(() => {
    epub.current.lang = monaco_controller.get_lang()
})

watch(() => epub.current.code, () => {
    monaco_controller.set_code(epub.current.code)
})

watch(() => epub.current.lang, () => {
    monaco_controller.set_lang(epub.current.lang)
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
        theme.set_colors()
    }, { immediate: true })
})
</script>

<template>
  <div
    ref="editor"
    style="width: 100%; height: calc(100% - 60px);"
    pst="abs inset-0"
  />
</template>
