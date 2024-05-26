interface FileNode {
    id: string
    name: string
    icon?: string
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

interface Moved {
    element: FileNode
    oldIndex: number
    newIndex: number
}

interface ContentsNode {
    id: string
    title: string
    selected?: boolean
    expanded?: boolean
    children?: ContentsNode[]
    parent?: ContentsNode
}

export type {
    FileNode,
    TreeProps, 
    TreeEmits, 
    Moved, 
    ContentsNode, 
}
