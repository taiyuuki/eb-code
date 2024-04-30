<script setup lang="ts">
import { initMonaco } from 'src/editor'
import { useElementRef } from 'src/composibles/useComp'
import { getTheme } from 'src/editor/shiki'
import { shikiToMonaco } from '@shikijs/monaco'

const editor = useElementRef()
const theme_type = ref<'light' | 'dark' | undefined>('light')

const vs_theme = computed(() => {
    return theme_type.value === 'light' ? 'vs' : 'vs-dark'
})

const monaco = initMonaco()

onMounted(() => {

    monaco.editor.create(editor.value, {
        model: monaco.editor.createModel(
            '<div></div>',
            'html',
        ),

        theme: vs_theme.value,
        
    })
    
    getTheme('github-dark', 'html').then(theme => {
        theme_type.value = theme.type

        // @ts-expect-error shikiToMonaco forced monaco import from 'monaco-editor-core', but here is 'monaco-editor'.
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
