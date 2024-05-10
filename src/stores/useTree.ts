// @unocss-include
import { useStatus } from './status'
import type { FileNode } from '@/components/types'
import store from '@/stores'
import { invoke_get_text } from '@/invoke'
import { domToObj, xmlToDom } from '@/utils/xml'

const status = useStatus(store)

const useTree = defineStore('file_nodes', {
    state: () => ({ 
        nodes: [] as FileNode[],
        root_id: '',
        opf_document: null as Document | null,
        metadata: {} as Record<string, any>,
    }),
    actions: {
        parse_epub(payload: { chapters: string[], pathes: string[], container: string }) {
            this.init()

            payload.chapters.forEach(name => {
                const file = payload.pathes.find(f => f === name)
                if (file) {
                    this.add_html(file)
                }
            })

            payload.pathes.forEach(file => {
                if (file.endsWith('.html') || file.endsWith('.htm') || file.endsWith('.xhtml')) {
                    if (this.nodes[0].children!.find(n => n.id === file)) {
                        return
                    }
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-html', type: 'navigation' })
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
                } else if (file === 'mimetype' || file === 'META-INF/container.xml') {
                    return
                } else {
                    this.add_other(file)
                }
            })
            this.add_parent()
            const dom_parser = new DOMParser()
            const xml = dom_parser.parseFromString(payload.container, 'text/xml')
            const rootfile = xml.getElementsByTagName('rootfile')[0]
            this.root_id = rootfile.getAttribute('full-path') || ''
            if (this.root_id !== '') {
                invoke_get_text(this.root_id, status.dir).then(payload => {
                    this.opf_document = xmlToDom(payload[0])
                    this.parse_opf()
                })
            }
        },
        parse_opf() {
            if (this.opf_document) {
                const package_node = this.opf_document.querySelector('package')
                const metadata_node = this.opf_document.querySelector('metadata')
                status.epub_version = package_node?.getAttribute('version') || '2.0'
                if (metadata_node) {
                    const children = Array.from(metadata_node.children)
                    children.filter(node => node.nodeName.startsWith('meta') || node.nodeName.startsWith('dc')).forEach(node => {
                        status.metadata.push(domToObj(node))
                    })
                }
            }
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
                type: 'folder',
            },
            {
                id: 'styles',
                name: 'Styles',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-css-opened' : 'i-vscode-icons:folder-type-css'
                },
                children: [],
                expanded: false,
                type: 'folder',
            },
            {
                id: 'images',
                name: 'Images',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-images-opened' : 'i-vscode-icons:folder-type-images'
                },
                children: [],
                expanded: false,
                type: 'folder',
            },
            {
                id: 'fonts',
                name: 'Fonts',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-fonts-opened' : 'i-vscode-icons:folder-type-fonts'
                },
                children: [],
                expanded: false,
                type: 'folder',
            },
            {
                id: 'scripts',
                name: 'Scripts',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-js-opened' : 'i-vscode-icons:folder-type-js'
                },
                children: [],
                expanded: false,
                type: 'folder',
            },
            {
                id: 'audio',
                name: 'Audio',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-audio-opened' : 'i-vscode-icons:folder-type-audio'
                },
                children: [],
                expanded: false,
                type: 'folder',
            },
            {
                id: 'video',
                name: 'Video',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-video-opened' : 'i-vscode-icons:folder-type-video'
                },
                children: [],
                expanded: false,
                type: 'folder',
            },
        
            {
                id: 'other',
                name: 'Other',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:default-folder-opened' : 'i-vscode-icons:default-folder'
                },
                children: [],
                expanded: false,
                type: 'folder',
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
        add_font(name: string) {
            this.nodes[3].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-font', type: 'font' })
        },
        add_js(name: string) {
            this.nodes[4].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-js', type: 'js' })
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
