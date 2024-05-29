<script setup lang="ts">
import { useStatus } from './stores/status'
import { invoke_setup } from './invoke'
import { notif_negative } from './notif'
import { basename } from './utils/path'

const status = useStatus()
defineOptions({ name: 'App' })

invoke_setup().then(payload => {
    status.current.save_path = payload.save_path
    status.set_dir(payload.dir)
    status.set_base_path(payload.base_path)
    status.parse_epub(payload)
}, e => {
    if (e !== '0') {
        notif_negative(`${basename(e)}不是有效的EPUB文件。`)
    }
})
</script>

<template>
  <router-view />
</template>
