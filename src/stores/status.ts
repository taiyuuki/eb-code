import { convertFileSrc } from '@tauri-apps/api/core'
import type { FileNode } from '@/components/types'
import { get_code, scroll_top_to } from '@/editor'
import type { Language } from '@/editor/shiki'
import { invoke_clean_cache, invoke_get_text, invoke_write_text } from '@/invoke'
import { filename, is_image, is_text } from '@/utils'

const useStatus = defineStore('status', { 
    state: () => ({ 
        nodes: [] as FileNode[],
        codes: {} as Record<string, { code: string, lang: Language }>,
        srces: {} as Record<string, string>,
        current: {
            save_path: '',
            id: '',
            is_dirty: false,
            code: '',
            lang: 'html' as Language,
            is_toogle: false,
            src: '',
        },
        scroll_tops: {} as Record<string, number>,
        dir: '',
        base_path: '',
        show_code: false,
        is_loading: false,
        is_saving: false,
    }),
    getters: {
        file_name(state) {
            return filename(state.current.save_path)
        },
    },
    actions: {
        has_code(id: string) {
            return id in this.codes
        },
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
            return id in this.srces
        },
        set_src(src: string) {
            this.show_code = false
            if (this.has_src(src)) {
                this.current.src = this.srces[src]

                return
            }
            const img_src = convertFileSrc(this.base_path + src)
            this.srces[src] = img_src
            this.current.src = img_src
        },
        on_change_node(new_node: FileNode, old_node: FileNode | null) {
            this.current.is_toogle = true
            const should_change = is_text(new_node.id)

            if (should_change && this.current.is_dirty) {
                const dirty_code = get_code()
                this.current.is_dirty = false
                if (old_node && this.has_code(old_node.id)) {
                    this.codes[old_node.id].code = dirty_code
                    invoke_write_text(this.dir, old_node.id, dirty_code)
                }
            }
            if (is_text(new_node.id)) {
                this.show_code = true
                if (this.has_code(new_node.id)) {
                    this.current.code = this.codes[new_node.id].code
                    this.current.lang = this.codes[new_node.id].lang
                    this.current.id = new_node.id
                    if (this.has_top(new_node.id)) {
                        scroll_top_to(this.get_top(new_node.id))
                    }
            
                    return
                }
    
                if (should_change) {
                    this.current.id = new_node.id
                    invoke_get_text(new_node.id, this.dir)
                }
            } else if (is_image(new_node.id)) {
                this.set_src(new_node.id)
            }
        },
        close_epub() {
            this.show_code = false
            this.current.code = ''
            this.current.src = ''
            this.current.id = ''
            this.current.lang = 'html'
            this.nodes = []
            this.codes = {}
            this.srces = {}
            this.scroll_tops = {}
            this.current.is_dirty = false
            this.current.is_toogle = false
            this.current.save_path = ''
            invoke_clean_cache(this.dir)
            this.dir = ''
        },
    },
})

export { useStatus }
