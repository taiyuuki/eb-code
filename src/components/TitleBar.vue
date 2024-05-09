<script setup lang="ts">
import type { Event } from '@tauri-apps/api/event'
import { Window } from '@tauri-apps/api/window'
import { open, save } from '@tauri-apps/plugin-dialog'
import { listen } from '@tauri-apps/api/event'
import { invoke_clean_cache, invoke_open_epub, invoke_save_epub } from '@/invoke'
import { useTheme } from '@/stores/theme'
import { useTree } from '@/stores/useTree'
import { useStatus } from '@/stores/status'
import { notif_negative, notif_positive } from '@/notif'
const appWindow = new Window('main')
let is_maximized = ref(false)

async function toggle_maximize() {
    await appWindow.toggleMaximize()
    is_maximized.value = await appWindow.isMaximized()
}

const theme = useTheme()
const tree = useTree()
const status = useStatus()

async function open_epub_file() {
    if (status.is_loading || status.is_saving) {
        return
    }
    
    const file = await open({
        filters: [
            {
                name: '打开EPUB文件',
                extensions: ['epub'],
            },
        ],
    })
    const path = file?.path
    if (path) {
        status.is_loading = true
        invoke_open_epub(path)
        status.current.save_path = path
    }
}

function save_epub_file() {
    if (status.is_loading || status.is_saving) {
        notif_negative('当前文件尚未处理完毕，请稍后再试。')

        return
    }
    if (status.current.save_path === '') {
        save_epub_to()
    } else {
        status.is_saving = true
        invoke_save_epub(status.dir, status.current.save_path)
    }
}

async function save_epub_to() {
    if (status.is_loading || status.is_saving) {
        notif_negative('当前文件尚未处理完毕，请稍后再试。')

        return
    }
    const path = await save({
        filters: [
            {
                name: '保存EPUB文件',
                extensions: ['epub'],
            },
        ],
        
    })

    if (path) {
        status.is_saving = true
        status.current.save_path = path
        invoke_save_epub(status.dir, path)
    }
}

function close_epub() {
    invoke_clean_cache(status.dir)
    tree.clean()
    status.close_epub()
}

listen('epub-opened', (event: Event<{ chapters: string[], pathes: string[], dir: string, base_path: string }>) => {
    if (status.dir !== '') {
        status.close_epub()
    }
    tree.parsePayload(event.payload)
    status.set_dir(event.payload.dir)
    status.set_base_path(event.payload.base_path)
    status.is_loading = false
})

listen('epub-saved', () => {
    status.is_saving = false
    notif_positive('文件已保存')
})

listen('epub-save-error', () => {
    status.is_saving = false
    notif_negative('文件因未知原因保存失败，建议重编辑器后重试。')
})
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
        bg="var-eb-bg"
        text="var-eb-fg"
        w="fit"
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
            @click="save_epub_file"
          >
            <q-item-section>
              保存
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            @click="save_epub_to"
          >
            <q-item-section>
              另存为
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            @click="close_epub"
          >
            <q-item-section>
              关闭当前文件
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
@/stores/status
