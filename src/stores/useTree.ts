// @unocss-include
import type { FileNode } from '@/components/types'

const useTree = defineStore('file_nodes', {
    state: () => ({ nodes: [] as FileNode[] }),
    actions: {
        parsePayload(payload: { chapters: string[], pathes: string[] }) {
            this.init()

            payload.chapters.forEach(name => {
                const file = payload.pathes.find(f => f === name)
                if (file) {
                    this.add_html(file)
                }
            })

            payload.pathes.forEach(file => {
                if (file.endsWith('.html') || file.endsWith('.htm') || file.endsWith('.xhtml')) {
                    return
                } else if (file.endsWith('.js')) {
                    this.add_js(file)
                } else if (file.endsWith('.css')) {
                    this.add_css(file)
                } else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif') || file.endsWith('.svg')) {
                    this.add_image(file)
                } else if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg')) {
                    this.add_audio(file)
                } else if (file.endsWith('.ttf') || file.endsWith('.otf') || file.endsWith('.woff') || file.endsWith('.woff2')) {
                    this.add_font(file)
                } else if (file.endsWith('.opf') || file.endsWith('.ncx')) {
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-text' })
                } else if (file === 'mimetype') {
                    return
                } else {
                    this.add_other(file)
                }
            })
            this.add_parent()
        },
        init() {
            this.nodes = [{
                id: 'text',
                name: 'Text',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-view-opened' : 'i-vscode-icons:folder-type-view'
                },
                children: [],
                expanded: false,
            },
            {
                id: 'styles',
                name: 'Styles',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-css-opened' : 'i-vscode-icons:folder-type-css'
                },
                children: [],
                expanded: false,
            },
            {
                id: 'images',
                name: 'Images',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-images-opened' : 'i-vscode-icons:folder-type-images'
                },
                children: [],
                expanded: false,
            },
            {
                id: 'fonts',
                name: 'Fonts',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-fonts-opened' : 'i-vscode-icons:folder-type-fonts'
                },
                children: [],
                expanded: false,
            },
            {
                id: 'scripts',
                name: 'Scripts',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-js-opened' : 'i-vscode-icons:folder-type-js'
                },
                children: [],
                expanded: false,
            },
            {
                id: 'audio',
                name: 'Audio',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-audio-opened' : 'i-vscode-icons:folder-type-audio'
                },
                children: [],
                expanded: false,
            },
            {
                id: 'video',
                name: 'Video',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-video-opened' : 'i-vscode-icons:folder-type-video'
                },
                children: [],
                expanded: false,
            },
        
            {
                id: 'other',
                name: 'Other',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:default-folder-opened' : 'i-vscode-icons:default-folder'
                },
                children: [],
                expanded: false,
            }]
        },
        clean() {
            this.nodes = []
        },
        add_html(name: string) {
            this.nodes[0].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-html', type: 'html' })
        },
        add_css(name: string) {
            this.nodes[1].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-css', type: 'css' })
        },
        add_image(name: string) {
            this.nodes[2].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-image', type: 'image' })
        },
        add_js(name: string) {
            this.nodes[3].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-js' })
        },
        add_font(name: string) {
            this.nodes[4].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-font', type: 'font' })
        },
        add_audio(name: string) {
            this.nodes[5].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-audio', type: 'audio' })
        },
        add_video(name: string) {
            this.nodes[6].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-video', type: 'video' })
        },
        add_other(name: string) {
            this.nodes[7].children!.push({ id: name, name, icon: 'i-vscode-icons:default-file', type: 'other' })
        },
        add_parent() {
            function add(node: FileNode) {
                if (node.children) {
                    node.children.forEach(child => {
                        child.parent = node
                        add(child)
                    })
                }
            }
            this.nodes.forEach(node => {
                add(node)
            })
        },
    },
})

export { useTree }
