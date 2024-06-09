<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { TauriEvent, listen } from '@tauri-apps/api/event'
import { useStatus } from './stores/status'
import { invoke_setup } from './invoke'
import { notif_negative } from './notif'
import { basename } from './utils/path'

const status = useStatus()
defineOptions({ name: 'App' })
const first_onload = useLocalStorage('first_onload', '1')

if (first_onload.value === '1') {

    invoke_setup().then(payload => {
        status.current.save_path = payload.save_path
        status.set_dir(payload.dir)
        status.set_base_path(payload.base_path)
        status.parse_epub(payload)
        first_onload.value = '0'
    }, e => {
        if (e !== '0') {
            notif_negative(`${basename(e)}不是有效的EPUB文件。`)
        }
    })
}

listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
    first_onload.value = '1'
})
</script>

<template>
  <router-view />
</template>
