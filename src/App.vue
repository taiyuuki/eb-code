<script setup lang="ts">
import { invoke_clean_cache } from './invoke'
import { useStatus } from './stores/status'

const status = useStatus()

defineOptions({ name: 'App' })

window.addEventListener('beforeunload', e => {
    const msg = '\\o/'
    e.preventDefault()
    e.returnValue = msg

    return msg
})

window.addEventListener('unload', () => {
    status.dir && invoke_clean_cache(status.dir)
})
</script>

<template>
  <router-view />
</template>
