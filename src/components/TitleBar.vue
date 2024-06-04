<script setup lang="ts">
import { Window } from '@tauri-apps/api/window'
import { ask, open, save } from '@tauri-apps/plugin-dialog'
import { TauriEvent, listen } from '@tauri-apps/api/event'
import { changed, invoke_clean_cache, invoke_create_epub, invoke_open_epub, invoke_save_epub } from '@/invoke'
import { useTheme } from '@/stores/theme'
import { useStatus } from '@/stores/status'
import { DISPLAY } from '@/static'
import { cover_setting } from '@/composables/cover_setting'
import { notif_negative, notif_positive } from '@/notif'
import { useActivity } from '@/composables/useActivity'
import { dirty_meta } from '@/composables/dirty_meta'
import { contents_setting } from '@/composables/contents_setting'
import { usePreview } from '@/stores/preview'

const appWindow = new Window('main')
const is_maximized = ref(false)
const new_epub_menu = ref()

function close_window() {
    appWindow.close()
}

async function toggle_maximize() {
    await appWindow.toggleMaximize()
}

async function get_maximized() {
    is_maximized.value = await appWindow.isMaximized()
}

listen(TauriEvent.WINDOW_RESIZED, get_maximized)

onMounted(get_maximized)

const theme = useTheme()
const status = useStatus()
const activity_nodes = useActivity()
const router = useRouter()
const preview = usePreview()

async function open_epub_file() {
    if (status.is_opening || status.is_saving) {
        notif_negative('当前文件尚未处理完毕，请稍后再试。')

        return
    }

    if (changed.dirty) {
        const conf = await ask('当前文件尚未保存，是否继续？', {
            title: '确认',
            okLabel: '是',
            cancelLabel: '否',
        })
        if (conf) {
            changed.dirty = false
        } else {
            return
        }
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
            status.is_opening = false
            status.parse_epub(payload)
            router.replace({ path: '/' })
        }, () => {
            status.is_opening = false
            notif_negative('失败！不是有效的EPUB文件。')
        })
    }
}

async function create_epub(version: number) {
    if (changed.dirty) {
        const conf = await ask('当前文件尚未保存，是否继续？', {
            title: '确认',
            okLabel: '是',
            cancelLabel: '否',
        })
        if (conf) {
            changed.dirty = false
        }else {
            return
        }
    }
    const payload = await invoke_create_epub(version)
    if (status.dir !== '') {
        status.close_epub()
    }
    status.parse_epub(payload)
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
        defaultPath: status.current.save_path || 'Unnamed.epub',
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
async function close_epub() {
    if (changed.dirty) {
        const conf = await ask('当前文件尚未保存，是否继续？', {
            title: '确认',
            okLabel: '是',
            cancelLabel: '否',
        })
        if (conf) {
            changed.dirty = false
        } else {
            return
        }
    }
    status.clean_tree()
    status.dir && invoke_clean_cache(status.dir)
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
    status.metadata.length = 0
    status.parse_metadata()
    status.display = DISPLAY.METADATA
}

function toggle_preview() {
    if (preview.display) {
        preview.close()
    } else {
        preview.open()
    }
}

defineExpose({
    open_epub_file,
    create_epub,
    save_epub,
    save_epub_to,
    close_epub,
    edit_metadata,
    toggle_preview,
})
</script>

<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <div
      h="36"
      p="8"
      m="x-5"
    >
      <img
        height="20px"
        src="icons/epub.svg"
        alt="epub.svg"
      >
    </div>
    <q-btn
      :ripple="false"
      label="文件"
      unelevated
      square
      flat
    >
      <q-menu
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
          <q-item clickable>
            <q-item-section>
              新建
            </q-item-section>
            <q-item-section side>
              <div
                class="i-ic:round-keyboard-arrow-right"
                h="20"
                w="20"
              />
            </q-item-section>
            <q-menu
              ref="new_epub_menu"
              anchor="top end"
              self="top start"
            >
              <q-list>
                <q-item
                  v-close-popup
                  clickable
                  @click="create_epub(2)"
                >
                  <q-item-section>EPUB 2</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="create_epub(3)"
                >
                  <q-item-section>EPUB 3</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
          <q-separator :dark="theme.dark" />
          <q-item
            v-close-popup="status.editable"
            :disable="!status.editable"
            :clickable="status.editable"
            @click="save_epub"
          >
            <q-item-section>
              保存
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="status.editable"
            :disable="!status.editable"
            :clickable="status.editable"
            @click="save_epub_to"
          >
            <q-item-section>
              另存为
            </q-item-section>
          </q-item>
          <q-separator :dark="theme.dark" />
          <q-item
            v-close-popup
            :disable="!status.editable"
            :clickable="status.editable"
            @click="close_epub"
          >
            <q-item-section>
              关闭当前文件
            </q-item-section>
          </q-item>
          <q-separator :dark="theme.dark" />
          <q-item
            v-close-popup
            clickable
            @click="close_window"
          >
            <q-item-section>
              退出
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      :ripple="false"
      label="编辑"
      unelevated
      square
      flat
    >
      <q-menu
        w="fit"
      >
        <q-list>
          <q-item
            v-close-popup="status.editable"
            :disable="!status.editable"
            :clickable="status.editable"
            @click="cover_setting = true"
          >
            <q-item-section>
              封面设置
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="status.editable"
            :disable="!status.editable"
            :clickable="status.editable"
            @click="edit_metadata"
          >
            <q-item-section>
              编辑元数据
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="status.editable"
            :disable="!status.editable"
            :clickable="status.editable"
            @click="contents_setting = true"
          >
            <q-item-section>
              编辑目录
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      :ripple="false"
      label="视图"
      unelevated
      square
      flat
    >
      <q-menu>
        <q-list>
          <q-item
            :disable="!status.editable"
            :clickable="status.editable"
            @click="toggle_preview"
          >
            <q-item-section>
              预览
            </q-item-section>
            <q-item-section
              side
            >
              <div
                v-if="preview.display"
                class="i-ic:baseline-check-box"
                h="20"
                w="20"
              />
              <div
                v-else
                class="i-ic:baseline-check-box-outline-blank"
                h="20"
                w="20"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <div class="titlebar-buttons">
      <div
        id="titlebar-minimize"
        w="36"
        h="36"
        m="r-15"
        class="titlebar-button i-mdi:window-minimize"
        @click="appWindow.minimize()"
      />
      <div
        v-if="is_maximized"
        id="titlebar-maximize"
        w="36"
        h="36"
        m="r-15"
        class="titlebar-button i-bx:windows"
        @click="toggle_maximize"
      />
      <div
        v-else
        id="titlebar-unmaximize"
        w="36"
        h="36"
        m="r-15"
        class="titlebar-button i-bx:window"
        @click="toggle_maximize"
      />
      <div
        id="titlebar-close"
        w="36"
        h="36"
        m="r-15"
        class="titlebar-button i-mdi:close-thick"
        @click="appWindow.close()"
      />
    </div>
  </div>
</template>

<style scoped>
.titlebar {
    background: var(--vscode-button-background);
    user-select: none;
    display: flex;
    justify-content: content-between;
    align-items: middle;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    box-sizing: border-box;
    border-width: 0 0 1px 0;
    border-style: solid;
    border-color: var(--vscode-textSeparator-foreground);
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
  background-color: var(--vscode-button-foreground);
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
  opacity: 1;
}
.q-btn {
  background-color: transparent;
}
</style>
