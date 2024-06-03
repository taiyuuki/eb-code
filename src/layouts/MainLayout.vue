<script setup lang="ts">
import TitleBar from '@/components/TitleBar.vue'
import { useCompRef } from '@/composables/useComp'
import { contents_setting } from '@/composables/contents_setting'
import { cover_setting } from '@/composables/cover_setting'

const titlebar = useCompRef(TitleBar)
onBeforeMount(() => {
    document.documentElement.classList.add('monaco-component')
    document.documentElement.addEventListener('contextmenu', e => {
        e.preventDefault()
    })

    // document.addEventListener('keydown', function(e: KeyboardEvent) {

    //     if (
    //         e.key === 'F5'
    //         || e.ctrlKey && e.key === 'r'
    //         || e.metaKey && e.key === 'r'
    //     ) {
    //         e.preventDefault()
    //     }
    // })
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
      <TitleBar ref="titlebar" />
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
