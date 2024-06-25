<script setup lang="ts">
import TitleBar from '@/components/TitleBar.vue'
import { useCompRef } from '@/composables/useComp'
import { contents_setting } from '@/composables/contents_setting'
import { cover_setting } from '@/composables/cover_setting'
import { set_font_size } from '@/editor'
import { useFontSize } from '@/stores/font-size'
import { DISPLAY } from '@/static'
import { useStatus } from '@/stores/status'
import { check_update } from '@/notif/update'

const titlebar = useCompRef(TitleBar)
const font_size = useFontSize()
const status = useStatus()

onBeforeMount(() => {
    document.documentElement.classList.add('monaco-component')

    document.addEventListener('keydown', function(e: KeyboardEvent) {
        if (status.display === DISPLAY.CODE) {
            if ((e.key === '-' || e.key === '_') && e.ctrlKey) {
                e.preventDefault()
                font_size.size = Math.max(font_size.size - 2, 8)
                set_font_size(font_size.size)
            }
            else if ((e.key === '+' || e.key === '=') && e.ctrlKey) {
                e.preventDefault()
                font_size.size = Math.min(font_size.size + 2, 40)
                set_font_size(font_size.size)
            }
        }
    })

    if (window.location.hostname !== 'tauri.localhost') {
        return
    }

    document.addEventListener('keydown', function(e: KeyboardEvent) {
        if (
            e.key === 'F5'
            || e.ctrlKey && e.key === 'r'
            || e.metaKey && e.key === 'r'
        ) {
            e.preventDefault()
        }
        else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            titlebar.value.save_epub()
        }
    })

    document.addEventListener('contextmenu', e => {
        e.preventDefault()

        return false
    }, { capture: true })

    document.addEventListener('selectstart', e => {
        e.preventDefault()

        return false
    }, { capture: true })
    check_update(false)
})

function open() {
    titlebar.value.open_epub_file()
}

function save() {
    titlebar.value.save_epub()
}

function create(version: number) {
    titlebar.value.create_epub(version)
}

function set_meta() {
    titlebar.value.edit_metadata()
}

function toggle_preview() {
    titlebar.value.toggle_preview()
}
</script>

<template>
  <q-layout>
    <q-page-container pst="abs t-37 r-0 l-0">
      <TitleBar
        ref="titlebar"
      />
      <ToolBar
        @open="open"
        @save="save"
        @create="create"
        @meta="set_meta"
        @cover="cover_setting = true"
        @contents="contents_setting = true"
        @preview="toggle_preview"
      />
      <router-view />
      <StatusBar />
    </q-page-container>
  </q-layout>
</template>
