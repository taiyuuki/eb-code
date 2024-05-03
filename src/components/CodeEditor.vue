<script setup lang="ts">
import { shikiToMonaco } from '@shikijs/monaco'
import { useElementRef } from 'composables/useComp'
import type { HighlighterCore } from 'shiki/index.mjs'
import { initMonaco } from '@/editor'
import { type Language, getLighter } from '@/editor/shiki'
import { useTheme } from '@/stores/theme'
import { setOpacity } from '@/utils'

const theme = useTheme()

const props = withDefaults(defineProps<{ 
    code: string
    language: Language,
}>(), { code: '', theme: 'github-dark', language: 'html' })

const editor = useElementRef()

const monaco = initMonaco()

let hightlighter: HighlighterCore
theme.$subscribe(async() => {
    if (!hightlighter) {
        hightlighter = await getLighter()

        // @ts-expect-error shikiToMonaco forced import monaco from 'monaco-editor-core', but here is 'monaco-editor'.
        shikiToMonaco(hightlighter, monaco)
    }
    monaco.editor.setTheme(theme.shiki)

    const theme_colors = hightlighter.getTheme(theme.shiki)

    theme.color = theme_colors.fg
    theme.background = theme_colors.bg
    theme.dark = theme_colors.type === 'dark'

    theme['list.activeBorder'] = theme_colors.fg
    theme['list.border'] = setOpacity(theme_colors.fg, 0.5)
    theme.setColor()
}, { 
    immediate: true,
    detached: false,
})

onMounted(() => {

    monaco.editor.create(editor.value, {
        model: monaco.editor.createModel(
            props.code,
            props.language,
        ),
        automaticLayout: true,
    })
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
