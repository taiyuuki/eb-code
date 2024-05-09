interface FileNode {
    id: string
    name: string
    icon: string
    active?: boolean
    selected?: boolean
    expanded?: boolean
    open?: boolean
    children?: FileNode[]
    parent?: FileNode
    type?: string
}

interface TreeProps {
    files: FileNode[]
    level: number
    indent?: number
}

interface TreeEmits {
    (e: 'toggle', file: FileNode): void
}

export type { FileNode, TreeProps, TreeEmits }
