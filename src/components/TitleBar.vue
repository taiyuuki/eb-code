<script setup lang="ts">
import { Window } from '@tauri-apps/api/window'
import { open, save } from '@tauri-apps/plugin-dialog'
import { TauriEvent, listen } from '@tauri-apps/api/event'
import { invoke_clean_cache, invoke_open_epub, invoke_save_epub } from '@/invoke'
import { useTheme } from '@/stores/theme'
import { useStatus } from '@/stores/status'
import { DISPLAY } from '@/static'
import { cover_setting } from '@/composables/cover_setting'
import { notif_negative, notif_positive } from '@/notif'
import { useActivity } from '@/composables/useActivity'
import { dirty_meta } from '@/composables/dirty_meta'

const appWindow = new Window('main')
const is_maximized = ref(false)

async function toggle_maximize() {
    await appWindow.toggleMaximize()
}

listen(TauriEvent.WINDOW_RESIZED, async _ => {
    is_maximized.value = await appWindow.isMaximized()
})

const theme = useTheme()
const status = useStatus()
const activity_nodes = useActivity()

async function open_epub_file() {
    if (status.is_opening || status.is_saving) {
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
        status.is_opening = true
        invoke_open_epub(path).then(payload => {
            if (status.dir !== '') {
                status.close_epub()
            }
            status.current.save_path = path
            status.set_dir(payload.dir)
            status.set_base_path(payload.base_path)
            status.is_opening = false
            status.parse_epub(payload)
        }, () => {
            status.is_opening = false
            notif_negative('失败！不是有效的EPUB文件。')
        })
    }
}

async function save_epub() {
    if (status.current.save_path === '') {
        save_epub_to()
    } else if (status.is_opening || status.is_saving) {
        notif_negative('当前文件尚未处理完毕，请稍后再试。')
  
        return
    } else {
        status.is_saving = true
        try{
            if (status.meta_is_dirty) {
                Object.assign(status.metadata, dirty_meta.value)
                await status.save_meta()
                status.meta_is_dirty = false
            }
            await invoke_save_epub(status.dir, status.current.save_path)
        } catch(_e) {
            notif_negative('保存失败！缓存文件被删除了。')
            
            return
        }
        status.is_saving = false
        notif_positive('文件已保存')
    }
}

async function save_epub_to() {
    if (status.is_opening || status.is_saving) {
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
        try {
            await invoke_save_epub(status.dir, path)
        } catch(_e) {
            notif_negative('保存失败！缓存文件被删除了。')

            return 
        }
        status.is_saving = false
        notif_positive('文件已保存')
    }
}

function close_epub() {
    status.clean_tree()
    invoke_clean_cache(status.dir)
    status.close_epub()
}

function edit_metadata() {
    let node = status.tabs.find(n => n.id === 'metadata')
    if (!node) {
        node = reactive({
            id: 'metadata',
            name: '元数据编辑',
            icon: 'i-vscode-icons:file-type-maya',
            type: 'metadata',
        })
        status.tabs.push(node)
    }
    activity_nodes.on(node)
    status.metadata = []
    status.parse_metadata()
    status.display = DISPLAY.METADATA
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
            @click="save_epub"
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
          <q-separator :dark="theme.dark" />
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
    <q-btn
      label="编辑"
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
            @click="cover_setting = true"
          >
            <q-item-section>
              封面设置
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            @click="edit_metadata"
          >
            <q-item-section>
              编辑元数据
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
@/stores/tree
