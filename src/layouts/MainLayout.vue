<script setup lang="ts">
import TitleBar from '@/components/TitleBar.vue'
import { useCompRef } from '@/composables/useComp'
import { contents_setting } from '@/composables/contents_setting'
import { cover_setting } from '@/composables/cover_setting'
import { DISPLAY } from '@/static'
import { useEPUB } from '@/stores/epub'
import { check_update } from '@/notif/update'
import { useOption } from '@/stores/option'

const titlebar = useCompRef(TitleBar)
const epub = useEPUB()
const option = useOption()

onBeforeMount(() => {
    document.documentElement.classList.add('monaco-component')

    document.addEventListener('keydown', function(e: KeyboardEvent) {
        if (epub.display === DISPLAY.CODE) {
            if ((e.key === '-' || e.key === '_') && e.ctrlKey) {
                e.preventDefault()
                option.value.font_size = Math.max(option.value.font_size - 2, 14)
            }
            else if ((e.key === '+' || e.key === '=') && e.ctrlKey) {
                e.preventDefault()
                option.value.font_size = Math.min(option.value.font_size + 2, 40)
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
