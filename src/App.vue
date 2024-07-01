<script setup lang="ts">
import { invoke_clean_cache } from './invoke'
import { useEPUB } from './stores/epub'

const epub = useEPUB()

defineOptions({ name: 'App' })

window.addEventListener('beforeunload', e => {
    const msg = '\\o/'
    e.preventDefault()
    e.returnValue = msg

    return msg
})

window.addEventListener('unload', () => {
    epub.dir && invoke_clean_cache(epub.dir)
})
</script>

<template>
  <router-view />
</template>
