<script setup lang="ts">
import { Window } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { useTheme } from '@/stores/theme'
const appWindow = new Window('main')
let is_maximized = ref(false)

async function toggle_maximize() {
    await appWindow.toggleMaximize()
    is_maximized.value = await appWindow.isMaximized()
}

const theme = useTheme()

async function open_epub_file() {
    const file = await open({
        filters: [
            {
                name: 'epub',
                extensions: ['epub'],
            },
        ],
    })
    const path = file?.path
    if (path) {
        invoke('open_epub', { path })
    }
}
</script>

<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <q-btn
      label="文件"
      unelevated
    >
      <q-menu
        :dark="theme.dark"
        class="bg-var-eb-bg"
        w="fit"
        anchor="bottom middle"
      >
        <q-list>
          <q-item
            v-close-popup
            clickable
            @click="open_epub_file"
          >
            <q-item-section>
              打开
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
          >
            <q-item-section>
              新建
            </q-item-section>
          </q-item>
          <q-separator :dark="theme.dark" />
          <q-item
            v-close-popup
            clickable
          >
            <q-item-section>
              保存
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
          >
            <q-item-section>
              另存为
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <div class="titlebar-buttons">
      <div
        id="titlebar-minimize"
        w="28"
        h="28"
        m="r-15"
        class="titlebar-button i-mdi:window-minimize"
        @click="appWindow.minimize()"
      />
      <div
        v-if="is_maximized"
        id="titlebar-maximize"
        w="28"
        h="28"
        m="r-15"
        class="titlebar-button i-bx:windows"
        @click="toggle_maximize"
      />
      <div
        v-else
        id="titlebar-unmaximize"
        w="28"
        h="28"
        m="r-15"
        class="titlebar-button i-bx:window"
        @click="toggle_maximize"
      />
      <div
        id="titlebar-close"
        w="28"
        h="28"
        m="r-15"
        class="titlebar-button i-mdi:close-thick"
        @click="appWindow.close()"
      />
    </div>
  </div>
</template>

<style>
.titlebar {
    height: 30px;
    background: var(--eb-bg);
    user-select: none;
    display: flex;
    justify-content: content-between;
    align-items: middle;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }
  .titlebar-buttons {
    position:absolute;
    width: fit-content;
    right: 0;
    display: flex;
    justify-content: flex-end;
    align-items: middle;
  }
  .titlebar-button {
    opacity: 0.65;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    user-select: none;
    -webkit-user-select: none;
  }
  .titlebar-button:hover {
    background: var(--eb-fg);
    opacity: 1;
  }
</style>
