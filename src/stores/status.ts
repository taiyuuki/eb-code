import { convertFileSrc } from '@tauri-apps/api/core'
import type { FileNode } from '@/components/types'
import type { Language } from '@/editor/shiki'
import { invoke_clean_cache, invoke_get_text, invoke_write_text } from '@/invoke'
import { filename, is_image, is_text } from '@/utils'
import { get_scroll_top, scroll_top_to } from '@/editor'
import { useActivity } from '@/composables/useActivity'
import { notif_negative, notif_positive, notif_warning } from '@/notif'
import { domToObj, domToXml, objToDom, xmlToDom } from '@/utils/xml'

const DISPLAY = {
    NONE: 0,
    CODE: 1,
    IMAGE: 2,
    METADATA: 3,
}

const activity_nodes = useActivity()

const useStatus = defineStore('status', { 
    state: () => ({
        nodes: [] as FileNode[],
        opf_id: '', // opf文件路径，即container.xml里的filepath
        opf_document: null as Document | null,
        tabs: [] as FileNode[], // 打开的标签
        image_srces: {} as Record<string, string>, // 图片src
        current: {
            save_path: '', // epub保存路径
            id: '', // 打开文件的id，例如META-INF/container.xml
            is_dirty: false, // 当前文件被修改且未保存
            code: '', // 当前文件内容
            lang: 'html' as Language, // 当前打开的文本文件类型
            src: '', // 当前打开的图片src
        },
        scroll_tops: {} as Record<string, number>, // 记录打开文件的滚动位置
        dir: '', // 缓存文件夹
        base_path: '', // 缓存文件夹完整路径
        display: DISPLAY.NONE, // 展示
        is_opening: false, // 正在打开EPUB
        is_saving: false, // 正在保存EPOUB
        is_reading: false, // 正在读取文本文件内容
        is_writing: false, // 正在写入文本
        is_toogle: false, // 正在切换文件
        epub_version: '2.0', // EPUB版本
        metadata: [] as Record<string, any>[], // EPUB元数据
        cover_src: '',
    }),
    getters: {

        // EPUB文件名
        file_name(state) {
            return filename(state.current.save_path)
        },
    },
    actions: {
        parse_epub(payload: { chapters: string[], pathes: string[], container: string }) {
            this.init_tree()

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
            const dom = xmlToDom(payload.container)
            const rootfile = dom.getElementsByTagName('rootfile')[0]
            this.opf_id = rootfile.getAttribute('full-path') || ''
            this.parse_opf()
        },
        async parse_opf() {
            if (this.opf_id !== '') {
                const payload = await invoke_get_text(this.opf_id, this.dir)
                this.opf_document = xmlToDom(payload[0])
                if (this.opf_document) {

                    // epub版本
                    const package_node = this.opf_document.querySelector('package')
                    this.epub_version = package_node?.getAttribute('version') || '2.0'

                    // 封面
                    let cover_node = this.opf_document.querySelector('item[properties="cover-image"]')
                    if (!cover_node) {
                        const meta_cover = this.opf_document.querySelector('meta[name="cover"]')
                        if (meta_cover) {
                            const cover_id = meta_cover.getAttribute('content')
                            if (cover_id) {
                                cover_node = this.opf_document.querySelector(`item[id="${cover_id}"]`)
                            }
                        } else {
                            cover_node = this.opf_document.querySelector('item[id="cover.jpg"]')
                            if (!cover_node) {
                                cover_node = this.opf_document.querySelector('item[id="cover.png"]')
                            }
                        }
                    }
                    const cover_href = cover_node?.getAttribute('href')
                    if (cover_href) {
                        const path = this.nodes[2].children!.find(n => n.id.endsWith(cover_href))?.id
                        this.cover_src = path ? convertFileSrc(this.base_path + path) : ''
                    } else {
                        this.cover_src = ''
                    }

                    // 元数据
                    const metadata_node = this.opf_document.querySelector('metadata')
                    if (metadata_node) {
                        const children = Array.from(metadata_node.children)
                        const temp = {} as Record<string, Record<string, any>>
                        children.filter(node => node.nodeName.startsWith('dc')).forEach(node => {
                            const obj = domToObj(node)
                            this.metadata.push(obj)
                            const id = node.getAttribute('id')
                            if (id) {
                                temp[`#${id}`] = obj
                            }
                        })
                        children.filter(node => node.nodeName.startsWith('meta')).forEach(node => {
                            const t_id = node.getAttribute('refines')
                            if (t_id && temp[t_id]) {
                                if (!temp[t_id].children) {
                                    temp[t_id].children = []
                                }
                                temp[t_id].children.push(domToObj(node))
                            } else {
                                this.metadata.push(domToObj(node))
                            }
                        })
                    }
                }
            }
        },
        init_tree() {
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
        clean_tree() {
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
        add_tab(node: FileNode) {
            if (node.children || this.tabs.find(n => n.id === node.id)) {
                return
            }
            this.tabs.push(node)
        },
        remove_tab_by_id(id: string) {
            this.tabs = this.tabs.filter(t => t.id !== id)
        },
        close_left(node: FileNode) {
            const i = this.tabs.indexOf(node)
            this.tabs = this.tabs.slice(i)
            if (this.tabs.every(n => !n.open)) {
                this.open_first()
            }
        },
        close_right(node: FileNode) {
            const i = this.tabs.indexOf(node)
            this.tabs = this.tabs.slice(0, i + 1)
            if (this.tabs.every(n => !n.open)) {
                this.open_first()
            }
        },
        close_other(node: FileNode) {
            this.tabs = [node]
            if (this.tabs.every(n => !n.open)) {
                this.open_first()
            }
        },
        open_first() {
            if (this.tabs[0]) {
                this.open(this.tabs[0])
            } else {
                this.display = DISPLAY.NONE
                this.current.code = ''
                this.current.src = ''
            }
        },
        add_scroll_top(id: string, top: number) {
            this.scroll_tops[id] = top
        },
        add_meta(tagName: string, value: string) {
            const count = this.metadata.filter(m => m.tagName === tagName).length
            const id = tagName.replace('dc:', '') + (count ? count + 1 : '')
            this.metadata.push({
                id,
                tagName: tagName,
                textContent: value,
                r_id: id,
            })
        },
        add_meta_child(item: Record<string, any>, property: string, value: string) {
            item.children = item.children || []
            const count = item.children.filter((c: any) => c?.property === property).length
            const id = property.replace('dc:', '') + (count ? count + 1 : '')
            item.children.push({
                id,
                refines: `#${item.id}`,
                tagName: 'meta',
                property,
                textContent: value,
                r_id: id,
            })
        },
        remove_meta(item: Record<string, any>) {
            this.metadata = this.metadata.filter(m => m !== item)
        },
        remove_meta_child(item: Record<string, Record<string, any>[]>, child: Record<string, any>) {
            if (!item.children) {
                return
            }
            item.children = item.children.filter(c => c !== child)
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
        has_src(id: string) {
            return id in this.image_srces
        },
        set_src(src: string) {
            this.display = DISPLAY.IMAGE
            if (this.has_src(src)) {
                this.current.src = this.image_srces[src]

                return
            }
            const img_src = convertFileSrc(this.base_path + src)
            this.image_srces[src] = img_src
            this.current.src = img_src
        },
        set_text(code: string, lang: Language, id: string) {
            this.current.code = code
            this.current.lang = lang
            this.current.id = id
            this.is_reading = false
            this.is_toogle = false
            scroll_top_to(this.get_top(id))
        },
        open(node: FileNode) {

            // 如果是同一个节点，不操作
            if (activity_nodes.opened_node === node || this.is_reading) {
                return
            }

            // 如果有已打开的节点且是文本文件，记录它的滚动位置
            if (activity_nodes.opened_node) {
                if (is_text(activity_nodes.opened_node.id)) {
                    const line = get_scroll_top()
                    this.add_scroll_top(activity_nodes.opened_node.id, line)
                }
            }
            
            activity_nodes.on(node)// 切换活动节点
            this.is_toogle = true // 切换文件

            // 分情况打开标签
            if (is_text(node.id)) {
                this.display = DISPLAY.CODE
                this.is_reading = true
                invoke_get_text(node.id, this.dir).then(payload => {
                    this.set_text(payload[0], payload[1], node.id)
                }, () => {
                    notif_negative('缓存文件被删除，请重新打开EPUB。')
                })
            } else if (is_image(node.id)) {
                this.display = DISPLAY.IMAGE
                this.set_src(node.id)
            } else if (node.id === 'metadata') {
                this.metadata = []
                this.parse_opf().then(() => {
                    
                    this.display = DISPLAY.METADATA
                })
            }
        },
        save_opf() {
            if (this.is_writing) {
                notif_warning('操作过于频繁，请稍后再试。')

                return
            }

            this.is_writing = true
            const frag = document.createDocumentFragment() 
            this.metadata.forEach(m => {
                frag.appendChild(document.createTextNode('\n'))
                frag.appendChild(objToDom(m))
                if (m.children) {
                    m.children.forEach((c: any) => {
                        frag.appendChild(document.createTextNode('\n'))
                        frag.appendChild(objToDom(c))
                    })
                }
            })
            frag.appendChild(document.createTextNode('\n'))

            const meta_el = this.opf_document!.querySelector('metadata')!
            meta_el.innerHTML = ''
            meta_el.appendChild(frag)
            const code = domToXml(this.opf_document!)
            invoke_write_text(this.dir, this.opf_id, code).then(() => {
                notif_positive('元数据已保存!')
                this.is_writing = false
            }, () => {
                notif_negative('保存失败!')
                this.is_writing = false
            })
        },
        close_epub() {
            this.display = DISPLAY.NONE
            this.current.code = ''
            this.current.src = ''
            this.current.id = ''
            this.current.lang = 'html'
            this.tabs = []
            this.image_srces = {}
            this.scroll_tops = {}
            this.current.is_dirty = false
            this.is_toogle = false
            this.current.save_path = ''
            this.metadata = []
            invoke_clean_cache(this.dir)
            this.dir = ''
        },
    },
})

export { DISPLAY, useStatus }
