import { convertFileSrc } from '@tauri-apps/api/core'
import type { FileNode } from '@/components/types'
import type { Language } from '@/editor/shiki'
import { invoke_clean_cache, invoke_get_text } from '@/invoke'
import { filename, is_image, is_text } from '@/utils'

const useStatus = defineStore('status', { 
    state: () => ({ 
        nodes: [] as FileNode[],
        images: {} as Record<string, string>,
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
        show_code: false,
        is_opening: false,
        is_saving: false,
        is_reading: false,
        is_toogle: false,
    }),
    getters: {
        file_name(state) {
            return filename(state.current.save_path)
        },
    },
    actions: {
        add_tag(node: FileNode) {
            if (node.children || this.nodes.find(n => n.id === node.id)) {
                return
            }
            this.nodes.push(node)
        },
        remove_tag(node: FileNode) {
            this.nodes = this.nodes.filter(n => n.id !== node.id)
        },
        remve_tag_by_id(id: string) {
            this.nodes = this.nodes.filter(n => n.id !== id)
        },
        get_tag_by_id(id: string) {
            return this.nodes.find(n => n.id === id)
        },
        close_left(node: FileNode) {
            const i = this.nodes.indexOf(node)
            this.nodes = this.nodes.slice(i)
        },
        close_right(node: FileNode) {
            const i = this.nodes.indexOf(node)
            this.nodes = this.nodes.slice(0, i + 1)
        },
        close_other(node: FileNode) {
            this.nodes = [node]
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
            return id in this.images
        },
        set_src(src: string) {
            this.show_code = false
            if (this.has_src(src)) {
                this.current.src = this.images[src]

                return
            }
            const img_src = convertFileSrc(this.base_path + src)
            this.images[src] = img_src
            this.current.src = img_src
        },
        on_change_node(node: FileNode) {
            if (this.is_reading) {
                return
            }
            this.is_toogle = true
            if (is_text(node.id)) {
                this.show_code = true
                this.current.id = node.id
                invoke_get_text(node.id, this.dir)
                this.is_reading = true
            } else if (is_image(node.id)) {
                this.set_src(node.id)
            }
        },
        close_epub() {
            this.show_code = false
            this.current.code = ''
            this.current.src = ''
            this.current.id = ''
            this.current.lang = 'html'
            this.nodes = []
            this.images = {}
            this.scroll_tops = {}
            this.current.is_dirty = false
            this.is_toogle = false
            invoke_clean_cache(this.dir)
            this.dir = ''
        },
    },
})

export { useStatus }
