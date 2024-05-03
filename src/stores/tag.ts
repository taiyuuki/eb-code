import type { FileNode } from '@/components/types'

const useTags = defineStore('tags', { 
    state: () => ({ nodes: [] as FileNode[] }), 
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
    },
})

export { useTags }
