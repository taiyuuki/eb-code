import type { FileNode } from '@/components/types'
import type { Language } from '@/editor/shiki'

const useTags = defineStore('tags', { 
    state: () => ({ 
        nodes: [] as FileNode[],
        codes: {} as Record<string, { code: string, lang: Language }>,
    }),
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
    },
})

export { useTags }
