<script setup lang="ts">
import { Window } from '@tauri-apps/api/window'
import { ask, message, open, save } from '@tauri-apps/plugin-dialog'
import { TauriEvent, listen } from '@tauri-apps/api/event'
import { getVersion } from '@tauri-apps/api/app'
import { str_random } from '@taiyuuki/utils'
import { changed, invoke_clean_cache, invoke_create_epub, invoke_get_text, invoke_save_epub, invoke_search, invoke_write_text } from '@/invoke'
import { useEPUB } from '@/stores/epub'
import { DISPLAY, TREE } from '@/static'
import { cover_setting } from '@/composables/cover_setting'
import { notif_negative, notif_positive } from '@/notif'
import { useActivity } from '@/composables/useActivity'
import { dirty_meta } from '@/composables/dirty_meta'
import { contents_setting } from '@/composables/contents_setting'
import { usePreview } from '@/stores/preview'
import { check_update } from '@/notif/update'
import { get_editor, insert_text, redo, undo } from '@/editor'
import { check_xml, domToXml, split_DOM } from '@/utils/xml'
import { fmt_html } from '@/utils/format'
import { dirname, extname, filename } from '@/utils/path'
import { useRecent } from '@/stores/recent'

const appWindow = new Window('main')
const is_maximized = ref(false)

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

const epub = useEPUB()
const activity_nodes = useActivity()
const router = useRouter()
const preview = usePreview()
const recent = useRecent()

// 文件
async function open_epub_file() {
    if (epub.is_working || epub.is_saving) {
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
        }
        else {
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
        epub.open_epub(path)
        router.replace({ path: '/' })
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
        }
        else {
            return
        }
    }
    const payload = await invoke_create_epub(version)
    router.replace({ path: '/' })
    if (epub.dir !== '') {
        epub.close_epub()
    }
    epub.parse(payload)
}

async function save_epub() {
    if (epub.dir === '') {
        return
    }
    if (epub.save_path === '') {
        save_epub_to()
    }
    else if (epub.is_working || epub.is_saving) {
        notif_negative('当前文件尚未处理完毕，请稍后再试。')
  
        return
    }
    else {
        epub.is_saving = true
        try{
            if (epub.meta_is_dirty) {
                Object.assign(epub.metadata, dirty_meta.value)
                await epub.save_meta()
                epub.meta_is_dirty = false
            }
            await invoke_save_epub(epub.dir, epub.save_path)
        }
        catch(_e) {
            notif_negative('保存失败！缓存文件被删除了。')
            
            return
        }
        epub.is_saving = false
        notif_positive('文件已保存')
    }
}

async function save_epub_to() {
    if (epub.dir === '') {
        return
    }
    if (epub.is_working || epub.is_saving) {
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
        defaultPath: epub.save_path || 'Unnamed.epub',
    })

    if (path) {
        epub.is_saving = true
        epub.save_path = path
        try {
            await invoke_save_epub(epub.dir, path)
        }
        catch(_e) {
            notif_negative('保存失败！缓存文件被删除了。')

            return 
        }
        epub.is_saving = false
        notif_positive('文件已保存')
        recent.add(epub.save_path)
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
        }
        else {
            return
        }
    }
    epub.clean_tree()
    epub.dir && invoke_clean_cache(epub.dir)
    epub.close_epub()
    router.replace({ path: '/' })
}

// 书籍
function edit_metadata() {
    let node = epub.tabs.find(n => n.id === 'metadata')
    if (!node) {
        node = reactive({
            id: 'metadata',
            name: '元数据编辑',
            icon: 'i-vscode-icons:file-type-maya',
            type: 'metadata',
        })
        epub.tabs.push(node)
    }
    activity_nodes.on(node)
    epub.metadata.length = 0
    epub.parse_metadata()
    epub.display = DISPLAY.METADATA
}

// 视图
function toggle_preview() {
    preview.toggle()
}

// 帮助
function about() {
    getVersion().then(version => {
        message(`Ebook Code v${version}\n作者：Taiyuuki\n项目主页：https://github.com/taiyuuki/eb-code`, { title: '关于' })
    })
}

const show_insert_file = ref(false)

// 插入
function insert_file() {
    show_insert_file.value = true
}

function insert_split_marker() {
    if (epub.display === DISPLAY.CODE && activity_nodes.opened_node?.type === 'html') {
        const editor = get_editor()

        const code = editor.getValue()
        const pst = editor.getPosition()
        if (!pst) {
            return
        }
        const text_model = editor.getModel()
        
        const count = text_model?.getCharacterCountInRange({
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: pst.lineNumber,
            endColumn: pst.column,
        })
        if (count) {
            const split_marker = '<hr class="ebook-split-marker"/>'
            const text = `${code.substring(0, count)}${split_marker}${code.substring(count)}`

            const origin_dom = check_xml(text)
            if (!origin_dom) {
                notif_negative('不能在这里插入标记！')

                return
            }
            insert_text(split_marker)
        }

    }
}

// 编辑
async function split_at_cursor() {
    if (epub.display === DISPLAY.CODE && activity_nodes.opened_node?.type === 'html') {
        const editor = get_editor()

        const code = editor.getValue()
        const pst = editor.getPosition()
        if (!pst) {
            return
        }
        const text_model = editor.getModel()
        
        const count = text_model?.getCharacterCountInRange({
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: pst.lineNumber,
            endColumn: pst.column,
        })
        if (count) {
            const rand_class = str_random(8)
            const split_marker = `<br class="${rand_class}"/>`
            const text = `${code.substring(0, count)}${split_marker}${code.substring(count)}`

            const origin_dom = check_xml(text)
            if (!origin_dom) {
                notif_negative('不能在这里分割文件！')

                return
            }

            // 在标记处将html拆分为两个html
            const iterator = document.createNodeIterator(origin_dom, NodeFilter.SHOW_ELEMENT)
            let node = iterator.nextNode() as HTMLElement
            let split_node: HTMLElement | null = null
            while (node) {
                if (node?.classList?.contains(rand_class)) {
                    split_node = node
                    break
                }
                node = iterator.nextNode() as HTMLElement
            }

            if (split_node) {

                const { before, after } = split_DOM(split_node)

                const i = epub.nodes[TREE.HTML].children?.findIndex(n => n.id === epub.current.id)
                if (i !== void 0) {
                    try {
                        origin_dom.body.replaceChildren()
                        while(before.firstChild) {
                            origin_dom.body.appendChild(before.firstChild)
                        }
                        await invoke_write_text(epub.dir, epub.current.id, fmt_html(domToXml(origin_dom)))
                        origin_dom.body.replaceChildren()
                        while(after.firstChild) {
                            origin_dom.body.appendChild(after.firstChild)
                        }
                        await epub.new_html(i, domToXml(origin_dom))
                    }
                    catch(_e) {
                        notif_negative('不能在这里分割文件！')
                    }
                }
            }
            else {
                notif_negative('不能在这里分割文件！')
            }
        }

    }
}

async function split_at_marker() {
    const find_mark = await invoke_search(epub.dir, '<hr class="ebook-split-marker"/>', false, false, false, false, false)
    const file_map = new Map<string, { index: number, code: string }>()

    for await (const node of epub.nodes[TREE.HTML].children!) {
        const mark = find_mark.find(m => m[0] === node.id)
        if (!mark) {
            continue
        }
        const id = mark[0]
        const index = epub.nodes[TREE.HTML].children!.findIndex(n => n.id === id)
        const [code] = await invoke_get_text(id, epub.dir)
        
        const origin_dom = check_xml(code)
        if (!origin_dom) {
            message(`${id}文件格式错误！`, { title: '错误' })

            return
        }
        let nodes = document.createNodeIterator(origin_dom, NodeFilter.SHOW_ELEMENT)
        function find_split_node() {
            let node = nodes.nextNode() as HTMLElement
            while (node) {
                if (node?.tagName === 'hr' && node?.classList?.contains('ebook-split-marker')) {
                    return node
                }
                node = nodes.nextNode() as HTMLElement
            }

            return null
        }
        let split_node = find_split_node()
        let i = 1
        const temp_dom = origin_dom.cloneNode(true) as Document
        while (split_node) {
            const { before, after } = split_DOM(split_node)
            const before_id = `${`${dirname(id)}/${filename(id)}`}_${i.toString().padStart(4, '0')}.${extname(id)}`
            temp_dom.body.replaceChildren()
            while (before.firstChild) {
                temp_dom.body.appendChild(before.firstChild)
            }
            file_map.set(before_id, { index, code: fmt_html(domToXml(temp_dom)) })
            nodes = document.createNodeIterator(after)
            split_node = find_split_node()
            i++
            if (!split_node) {
                const after_id = `${`${dirname(id)}/${filename(id)}`}_${i.toString().padStart(4, '0')}.${extname(id)}`
                temp_dom.body.replaceChildren()
                while (after.firstChild) {
                    temp_dom.body.appendChild(after.firstChild)
                }
                file_map.set(after_id, { index, code: fmt_html(domToXml(temp_dom)) })
            }
        }
    }

    let j = 0
    for await (const [id, { index, code }] of file_map) {
        await epub.new_html(index + j, code, id, false)
        j++
    }

    for await (const mark of find_mark) {
        await epub.remove_file_by_id(mark[0])
    }
    await epub.save_opf()
}

defineExpose({
    open_epub_file,
    create_epub,
    save_epub,
    save_epub_to,
    close_epub,
    edit_metadata,
    toggle_preview,
    insert_file,
    insert_split_marker,
    split_at_cursor,
    split_at_marker,
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
          <q-separator class="sprt" />
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="save_epub"
          >
            <q-item-section>
              保存
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="save_epub_to"
          >
            <q-item-section>
              另存为
            </q-item-section>
          </q-item>
          <q-separator class="sprt" />
          <q-item
            v-close-popup
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="close_epub"
          >
            <q-item-section>
              关闭当前文件
            </q-item-section>
          </q-item>
          <q-separator class="sprt" />
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
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="undo"
          >
            <q-item-section>
              撤销
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="redo"
          >
            <q-item-section>
              重做
            </q-item-section>
          </q-item>
          <q-separator class="sprt" />
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="split_at_cursor"
          >
            <q-item-section>
              在光标位置拆分
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="split_at_marker"
          >
            <q-item-section>
              在标记位置拆分
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      :ripple="false"
      label="插入"
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
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="insert_file"
          >
            <q-item-section>
              文件
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="insert_split_marker"
          >
            <q-item-section>
              拆分标记
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      :ripple="false"
      label="书籍"
      unelevated
      square
      flat
    >
      <q-menu
        w="fit"
      >
        <q-list>
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="cover_setting = true"
          >
            <q-item-section>
              封面设置
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
            @click="edit_metadata"
          >
            <q-item-section>
              编辑元数据
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="epub.editable"
            :disable="!epub.editable"
            :clickable="epub.editable"
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
            :disable="!epub.editable"
            :clickable="epub.editable"
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
    <q-btn
      :ripple="false"
      label="帮助"
      unelevated
      square
      flat
    >
      <q-menu>
        <q-list>
          <q-item
            v-close-popup
            clickable
            @click="check_update()"
          >
            <q-item-section>
              检查更新
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            @click="about"
          >
            <q-item-section>
              关于
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
    <q-dialog
      v-model="show_insert_file"
      no-shake
      no-backdrop-dismiss
    >
      <InsertFile @close="show_insert_file = false" />
    </q-dialog>
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
