import type { FileNode } from 'components/types'

const activity_files = {
    selected_node: null as FileNode | null,
    expanded_node: null as FileNode | null,
    opened_node: null as FileNode | null,
    toggle_expanded(node: FileNode) {
        if (node.children) {
            node.expanded = !node.expanded
        }
    },

    open(node: FileNode) {
        if (this.opened_node === node) return
        this.opened_node && (this.opened_node.open = false)
        node.open = true
        this.opened_node = node
        let parent = node.parent
        while (parent) {
            parent.expanded = true
            parent = parent.parent
        }
    },
    select(node: FileNode) {
        if (this.selected_node === node) return
        this.selected_node && (this.selected_node.selected = false)
        node.selected = true
        this.selected_node = node
    },
    activate(node: FileNode) {
        if (node === this.expanded_node) return
        this.expanded_node && (this.expanded_node.active = false)
        if (node.children && node.expanded) {
            node.active = true
            this.expanded_node = node
        } else if (node.parent) {
            node.parent.active = true
            this.expanded_node = node.parent
        }
    },

    on(node: FileNode) {
        this.toggle_expanded(node)
        this.activate(node)
        this.select(node)
        if (!node.children) {
            this.open(node)
        }
    },
}

function useActivity() {
    return activity_files
}

export { useActivity }
