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

interface SearchResult {
    lnum: number
    line: string
}

interface EpubContent {
    chapters: string[], 
    paths: string[], 
    dir: string,
    base_path: string,
    container: string,
    save_path: string,
}

export type {
    EpubContent,
    FileNode,
    TreeProps, 
    TreeEmits, 
    Moved, 
    ContentsNode, 
    SearchResult,
}
