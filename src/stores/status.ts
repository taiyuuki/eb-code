import { convertFileSrc } from '@tauri-apps/api/core'
import type { FileNode } from '@/components/types'
import type { Language } from '@/editor/shiki'
import { invoke_clean_cache, invoke_get_text } from '@/invoke'
import { filename, is_image, is_text } from '@/utils'
import { get_scroll_top, scroll_top_to } from '@/editor'
import { useActivity } from '@/composables/useActivity'
import { notif_negative } from '@/notif'

const DISPLAY = {
    NONE: 0,
    CODE: 1,
    IMAGE: 2,
    METADATA: 3,
}

const activity_nodes = useActivity()

const useStatus = defineStore('status', { 
    state: () => ({ 
        tabs: [] as FileNode[],
        image_srces: {} as Record<string, string>,
        current: {
            save_path: '',
            id: '',
            is_dirty: false,
            code: '',
            lang: 'html' as Language,
            src: '',
        },
        scroll_tops: {} as Record<string, number>,
        dir: '',
        base_path: '',
        display: DISPLAY.NONE,
        is_opening: false,
        is_saving: false,
        is_reading: false,
        is_toogle: false,
        epub_version: '2.0',
        metadata: [] as Record<string, any>,
    }),
    getters: {
        file_name(state) {
            return filename(state.current.save_path)
        },
    },
    actions: {
        add_tab(node: FileNode) {
            if (node.children || this.tabs.find(n => n.id === node.id)) {
                return
            }
            this.tabs.push(node)
        },
        remove_tag(node: FileNode) {
            this.tabs = this.tabs.filter(n => n.id !== node.id)
        },
        remve_tag_by_id(id: string) {
            this.tabs = this.tabs.filter(n => n.id !== id)
        },
        get_tag_by_id(id: string) {
            return this.tabs.find(n => n.id === id)
        },
        close_left(node: FileNode) {
            const i = this.tabs.indexOf(node)
            this.tabs = this.tabs.slice(i)
            if (this.tabs.every(n => !n.open)) {
                this.open_first()
            }
        },
        close_right(node: FileNode) {
            const i = this.tabs.indexOf(node)
            this.tabs = this.tabs.slice(0, i + 1)
            if (this.tabs.every(n => !n.open)) {
                this.open_first()
            }
        },
        close_other(node: FileNode) {
            this.tabs = [node]
            if (this.tabs.every(n => !n.open)) {
                this.open_first()
            }
        },
        open_first() {
            if (this.tabs[0]) {
                this.open(this.tabs[0])
            } else {
                this.display = DISPLAY.NONE
                this.current.code = ''
                this.current.src = ''
            }
        },
        add_top(id: string, top: number) {
            this.scroll_tops[id] = top
        },
        remove_top(id: string) {
            delete this.scroll_tops[id]
        },
        has_top(id: string) {
            return id in this.scroll_tops
        },
        get_top(id: string) {
            return this.has_top(id) ? this.scroll_tops[id] : 1
        },
        set_dir(dir: string) {
            this.dir = dir
        },
        set_base_path(path: string) {
            this.base_path = path
        },
        get_dir() {
            return this.dir
        },
        has_src(id: string) {
            return id in this.image_srces
        },
        set_src(src: string) {
            this.display = DISPLAY.IMAGE
            if (this.has_src(src)) {
                this.current.src = this.image_srces[src]

                return
            }
            const img_src = convertFileSrc(this.base_path + src)
            this.image_srces[src] = img_src
            this.current.src = img_src
        },
        set_text(code: string, lang: Language, id: string) {
            this.current.code = code
            this.current.lang = lang
            this.current.id = id
            this.is_reading = false
            this.is_toogle = false
            scroll_top_to(this.get_top(id))
        },
        open(node: FileNode) {
            if (activity_nodes.opened_node === node || this.is_reading) {
                return
            }
            if (activity_nodes.opened_node) {
                if (is_text(activity_nodes.opened_node.id)) {
                    const line = get_scroll_top()
                    this.add_top(activity_nodes.opened_node.id, line)
                }
            }
            activity_nodes.on(node)
            this.is_toogle = true
            if (is_text(node.id)) {
                this.display = DISPLAY.CODE
                this.is_reading = true
                invoke_get_text(node.id, this.dir).then(payload => {
                    this.set_text(payload[0], payload[1], node.id)
                }, () => {
                    notif_negative('缓存文件被删除，请重新打开EPUB。')
                })
            } else if (is_image(node.id)) {
                this.display = DISPLAY.IMAGE
                this.set_src(node.id)
            } else if (node.id === 'metadata') {
                this.display = DISPLAY.METADATA
            }
        },
        close_epub() {
            this.display = DISPLAY.NONE
            this.current.code = ''
            this.current.src = ''
            this.current.id = ''
            this.current.lang = 'html'
            this.tabs = []
            this.image_srces = {}
            this.scroll_tops = {}
            this.current.is_dirty = false
            this.is_toogle = false
            this.current.save_path = ''
            invoke_clean_cache(this.dir)
            this.dir = ''
        },
    },
})

export { DISPLAY, useStatus }
