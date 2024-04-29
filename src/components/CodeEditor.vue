<script setup lang="ts">
import * as monaco from 'monaco-editor-core/esm/vs/editor/editor.api'

import { initMonaco } from 'src/editor'
import { useElementRef } from 'src/composibles/useComp'
import { getTheme } from 'src/editor/shiki'
import { shikiToMonaco } from '@shikijs/monaco'

const editor = useElementRef()
const theme_type = ref<'light' | 'dark' | undefined>('light')

const vs_theme = computed(() => {
    return theme_type.value === 'light' ? 'vs' : 'vs-dark'
})

initMonaco()

onMounted(() => {
    monaco.editor.create(editor.value, {
        model: monaco.editor.createModel(
            Array.from({ length: 20 }).fill('console.log("hello world")')
                .join('\n'),
            'javascript',
        ),

        theme: vs_theme.value,

        // fontSize: 14,
        // bracketPairColorization: { enabled: false },
        // glyphMargin: false,
        // automaticLayout: true,
        // folding: false,
        // lineDecorationsWidth: 10,
        // lineNumbersMinChars: 3,
        // fontFamily: 'DM Mono, monospace',
        // minimap: { enabled: false },
        // padding: { top: 8 },
        // overviewRulerLanes: 0,
        // fixedOverflowWidgets: true,
    })

    getTheme('github-dark', 'javascript').then(theme => {
        theme_type.value = theme.type
        shikiToMonaco(theme.hightlighter, monaco)
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
