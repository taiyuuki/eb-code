// @unocss-include
import { convertFileSrc } from '@tauri-apps/api/core'
import { arr_remove } from '@taiyuuki/utils'
import type { FileNode } from '@/components/types'
import type { Language } from '@/editor/shiki'
import { invoke_clean_cache, invoke_copy_file, invoke_get_text, invoke_remove_file, invoke_write_text } from '@/invoke'
import { basename, filename } from '@/utils/file'
import { is_audio, is_font, is_html, is_image, is_style, is_text, is_video } from '@/utils/is'
import { get_scroll_top, scroll_top_to } from '@/editor'
import { useActivity } from '@/composables/useActivity'
import { notif_negative, notif_positive, notif_warning } from '@/notif'
import { domToObj, domToXml, objToDom, xmlToDom } from '@/utils/xml'
import { DISPLAY, TREE } from '@/static'

const activity_nodes = useActivity()

function tree_index(name: string) {
    if (is_html(name)) {
        return TREE.HTML
    } else if (is_style(name)) {
        return TREE.STYLE
    } else if (is_image(name)) {
        return TREE.IMAGE
    } else if (is_font(name)) {
        return TREE.FONT
    } else if (name.endsWith('.js')) {
        return TREE.JS
    } else if (is_audio(name)) {
        return TREE.AUDIO
    } else if (is_video(name)) {
        return TREE.VIDEO
    } else {
        return TREE.OTHER
    }
}

const opf = { dom: null as Document | null }

const useStatus = defineStore('status', { 
    state: () => ({
        nodes: [] as FileNode[],
        opf_id: '', // opf文件路径，即container.xml里的filepath
        nav_href: '', // 导航文件路径
        nav_id: '', // 导航文件id
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
        namespaceURI: 'http://www.idpf.org/2007/ops',
        manifest_path: 'OEBPS/',
        image_path: 'Images/',
        text_path: 'Text/',
        style_path: 'Styles/',
        font_path: 'Fonts/',
        script_path: 'Scripts/',
        audio_path: 'Audios/',
        video_path: 'Videos/',
        other_path: 'Others/',
        nav_in_spine: false,
        nav_item: null as Element | null | undefined,
        nav_version: 2 as 2 | 3,
    }),
    getters: {

        // EPUB文件名
        file_name(state) {
            return filename(state.current.save_path)
        },
        book_id(state) {
            return state.metadata.find(m => m.tagName === 'dc:identifier')?.textContent || ''
        },
        book_title(state) {
            return state.metadata.find(m => m.tagName === 'dc:title')?.textContent || ''
        },
    },
    actions: {
        parse_epub(payload: { chapters: string[], pathes: string[], container: string }) {
            
            const dom = xmlToDom(payload.container)
            const rootfile = dom.getElementsByTagName('rootfile')[0]
            this.opf_id = rootfile.getAttribute('full-path') || ''

            this.init_tree()

            payload.chapters.forEach(name => {
                const file = payload.pathes.find(f => f === name)
                if (file) {
                    this.add_html(file)
                }
            })

            payload.pathes.forEach(file => {
                const name = file.toLowerCase()
                if (is_html(name)) {
                    return
                } else if (name.endsWith('.js')) {
                    this.add_js(file)
                } else if (is_style(name)) {
                    this.add_css(file)
                } else if (is_image(name)) {
                    this.add_image(file)
                } else if (is_audio(name)) {
                    this.add_audio(file)
                } else if (is_font(name)) {
                    this.add_font(file)
                } else if (name.endsWith('.opf') || name.endsWith('.ncx')) {
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-text' })
                } else if (file === 'mimetype' || file === 'META-INF/container.xml') {
                    return
                } else {
                    this.add_other(file)
                }
            })

            this.add_parent()
            this.manifest_path = `${this.opf_id.substring(0, this.opf_id.lastIndexOf('/'))}/`

            const get_sub_path = (path: string) => {
                return `${path.replace(this.manifest_path, '').substring(0, path.indexOf('/') + 1)}/`
            }

            const xhtml = this.nodes[0].children?.[0]?.id
            const css = this.nodes[1].children?.[0]?.id
            const img = this.nodes[2].children?.[0]?.id
            const font = this.nodes[3].children?.[0]?.id
            const scripts = this.nodes[4].children?.[0]?.id
            const audio = this.nodes[5].children?.[0]?.id
            const video = this.nodes[6].children?.[0]?.id
            if (xhtml) {
                this.text_path = get_sub_path(xhtml)
            }
            if (css) {
                this.style_path = get_sub_path(css)
            }
            if (img) {
                this.image_path = get_sub_path(img)
            }
            if (font) {
                this.font_path = get_sub_path(font)
            }
            if (scripts) {
                this.script_path = get_sub_path(scripts)
            }
            if (audio) {
                this.audio_path = get_sub_path(audio)
            }
            if (video) {
                this.video_path = get_sub_path(video)
            }

            this.parse_opf()
        },
        async parse_opf() {
            if (this.opf_id !== '') {
                const payload = await invoke_get_text(this.opf_id, this.dir)
                opf.dom = xmlToDom(payload[0])
                this.parse_namespaceURI()
                this.parse_version()
                this.parse_cover()
                this.parse_metadata()
                this.parse_nav()
            }
        },
        parse_namespaceURI() {
            if (opf.dom) {
                this.namespaceURI = opf.dom.documentElement.namespaceURI ?? this.namespaceURI
            }
        },
        parse_version() {
            if (opf.dom) {
                const package_node = opf.dom.querySelector('package')
                this.epub_version = package_node?.getAttribute('version') || '2.0'
            }
        },
        parse_cover() {
            if (opf.dom) {
                let cover_node = null
                const cover_id = opf.dom
                    .querySelector('meta[name="cover"]')
                    ?.getAttribute('content')
                
                if (cover_id) {
                    cover_node = opf.dom.querySelector(`item[id="${cover_id}"]`)
                } else {
                    cover_node = opf.dom.querySelector('item[properties="cover-image"]')
                
                }
                if (!cover_node) {
                    cover_node = opf.dom.querySelector('item[id="cover.jpg"]')
                    if (!cover_node) {
                        cover_node = opf.dom.querySelector('item[id="cover.png"]')
                    }
                }

                const cover_href = cover_node?.getAttribute('href')
                if (cover_href) {
                    const path = this.nodes[2].children!.find(n => n.id.endsWith(cover_href))?.id
                    this.cover_src = path ? convertFileSrc(this.base_path + path) : ''
                } else {
                    this.cover_src = ''
                }
                
            }
        },
        parse_metadata() {
            if (opf.dom) {

                const metadata_node = opf.dom.querySelector('metadata')
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
        },
        parse_nav() {
            if (this.epub_version.startsWith('3')) {
                const item = opf.dom?.querySelector('item[properties="nav"]')
                this.nav_href = item?.getAttribute('href') || ''
                this.nav_id = item?.getAttribute('id') || ''
                this.nav_item = opf.dom?.querySelector(`itemref[idref="${this.nav_id}"]`)
                this.nav_version = 3
            }
            if (this.nav_href === '') { // 2.0
                const id = opf.dom?.querySelector('spine[toc]')?.getAttribute('toc')
                const item = opf.dom?.querySelector(`item[id="${id}"]`)
                this.nav_href = item?.getAttribute('href') || 'toc.ncx'
                this.nav_version = 2
            }

            if (this.nav_href.endsWith('html')) {
                const file = this.manifest_path + this.nav_href
                const nav = this.nodes[0].children!.find(n => n.id === file)
                if (nav) {
                    nav.type = 'navigation'
                    nav.icon = 'i-vscode-icons:file-type-pddl-happenings'
                    this.nav_in_spine = true
                } else {
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-pddl-happenings', type: 'navigation' })
                    this.nav_in_spine = false
                }
            }
            
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

            // this.metadata = this.metadata.filter(m => m !== item)
            arr_remove(this.metadata, item)
        },
        save_meta() {
            if (this.is_writing) {
                notif_warning('操作过于频繁，请稍后再试。')

                return
            }

            this.is_writing = true
            const meta_el = opf.dom!.querySelector('metadata')!
            meta_el.innerHTML = ''
            meta_el.appendChild(document.createTextNode('\n'))

            // const frag = document.createDocumentFragment()
            // const _n = document.createTextNode('\n')
            // frag.appendChild(_n)
            this.metadata.forEach(m => {
                meta_el.appendChild(objToDom(m, this.namespaceURI))
                meta_el.appendChild(document.createTextNode('\n'))
                if (m.children) {
                    m.children.forEach((c: any) => {
                        meta_el.appendChild(objToDom(c, this.namespaceURI))
                        meta_el.appendChild(document.createTextNode('\n'))
                    })
                }
            })
            meta_el.appendChild(document.createTextNode('\n'))

            // const meta_el = opf.dom!.querySelector('metadata')!
            // meta_el.innerHTML = ''

            // meta_el.appendChild(frag)
            this.save_opf()
        },
        remove_meta_child(item: Record<string, Record<string, any>[]>, child: Record<string, any>) {
            if (!item.children) {
                return
            }

            // item.children = item.children.filter(c => c !== child)
            arr_remove(item.children, child)
        },
        async add_file(from: string, id: string, href: string, media_type: string, has?: boolean) {
            if (has) {
                delete this.image_srces[this.manifest_path + href]
                
            } else {
                const item = document.createElementNS(this.namespaceURI, 'item')
                item.setAttribute('id', id.replace(/\s/g, '_'))
                item.setAttribute('href', href)
                item.setAttribute('media-type', media_type)
    
                const manifest_node = opf.dom?.querySelector('manifest')
                manifest_node?.appendChild(item)
                manifest_node?.appendChild(document.createTextNode('\n'))
                this.save_opf()
            }
            await invoke_copy_file(from, this.dir, `${this.manifest_path}${href}`)
        },
        get_itemref_by_id(id: string) {
            const manifest_node = opf.dom?.querySelector('manifest')
            if (manifest_node) {
                const item = manifest_node.querySelector(`item[href="${id.replace(this.manifest_path, '')}"]`)
                if (item) {
                    const ref_id = item.id

                    return opf.dom?.querySelector(`itemref[idref="${ref_id}"]`)
                }
            }  
        },
        remove_file(node: FileNode) {
            const manifest_node = opf.dom?.querySelector('manifest')
            const spine_node = opf.dom?.querySelector('spine')
            if (manifest_node) {
                const item = manifest_node.querySelector(`item[href="${node.id.replace(this.manifest_path, '')}"]`)
                if (item) {
                    const id = item.id
                    manifest_node.removeChild(item)
                    if (spine_node) {
                        const itemref = spine_node.querySelector(`itemref[idref="${id}"]`)
                        if (itemref) {
                            spine_node.removeChild(itemref)
                        }
                    }
                    this.save_opf()
                }
            }
            if (this.has_src(node.id)) {
                delete this.image_srces[node.id]
            }
            const i = tree_index(node.id)

            arr_remove(this.nodes[i].children ?? [], node)
            arr_remove(this.nodes, node)
            if (activity_nodes.opened_node === node) {
                arr_remove(this.tabs, node)
                this.open_first()
            }
            invoke_remove_file(this.dir, node.id).then(() => {

                // TODO: 等功能完善后删除这里的通知
                notif_positive('完成')
            }, () => {
                notif_negative('发生错误！')
            })

            // TODO:如果删除的是封面，需要同时删除meta以及item的properties
            // TODO:如果删除的是XHTML，需要同时删除书脊

        },
        rename_file(node: FileNode, new_name: string) {
            const manifest_node = opf.dom?.querySelector('manifest')
            if (manifest_node) {
                const item = manifest_node.querySelector(`item[href="${node.id.replace(this.manifest_path, '')}"]`)
                if (item) {
                    const old_id = item.id
                    const new_id = basename(new_name).replace(/\s/g, '_')
                    
                    item.setAttribute('href', new_name)
                    item.setAttribute('id', new_id)

                    const spine_node = opf.dom?.querySelector('spine')
                    if (spine_node) {
                        const itemref = spine_node.querySelector(`itemref[idref="${old_id}"]`)
                        if (itemref) {
                            itemref.setAttribute('idref', new_id)
                        }
                        this.save_opf()
                    }
                }
            }
            if (this.has_src(node.id)) {
                delete this.image_srces[node.id]
            }

            // TODO: 如果重命名的是封面
            // TODO: 重命名xtml里的引用
        },
        move(old_i: number, new_i: number) {
            const spine_node = opf.dom?.querySelector('spine')
            const children = spine_node?.children
            if (children) {
                const moved_el = children[old_i]!
                if (new_i === children.length - 1) {
                    spine_node.appendChild(spine_node.removeChild(moved_el))
                    spine_node.appendChild(document.createTextNode('\n'))
                } else {
                    const target_el = children[new_i < old_i ? new_i : new_i + 1]!
                    spine_node?.insertBefore(spine_node?.removeChild(moved_el), target_el)
                    spine_node?.insertBefore(document.createTextNode('\n'), target_el)
                }
                
                this.save_opf()
            }
        },
        add_to_spine() {
            const spine_node = opf.dom!.querySelector('spine')
            if (this.nav_in_spine) {
                this.nav_item = document.createElementNS(this.namespaceURI, 'itemref')
                this.nav_item.setAttribute('idref', this.nav_id)
                this.nav_item.setAttribute('linear', 'yes')
                const children = spine_node?.children
                if (children?.length) {
                    spine_node?.insertBefore(this.nav_item, children[0])
                    spine_node?.insertBefore(document.createTextNode('\n'), children[1])
                } else {
                    spine_node?.appendChild(this.nav_item)
                }

            } else if (this.nav_item) {
                spine_node?.removeChild(this.nav_item)
            }
            this.save_opf()
        },
        set_cover(path: string) {
            if (this.has_src(path)) {
                this.cover_src = this.image_srces[path]
            } else {
                const src = convertFileSrc(this.base_path + path)
                this.cover_src = src
                this.image_srces[path] = src
            }
            const id = path.replace(this.manifest_path, '')
            const item_cover = opf.dom?.querySelector(`item[href="${id}"`)
            if (item_cover) {
                item_cover.setAttribute('properties', 'cover-image')
                const content = item_cover.id
                let meta_cover = opf.dom?.querySelector('meta[name="cover"]')
                if (meta_cover) {
                    const old_content = meta_cover.getAttribute('content')
                    if (old_content) {
                        const old_item = opf.dom?.querySelector(`item[id="${old_content}"`)
                        if (old_item) {
                            old_item.removeAttribute('properties')
                        }
                    }
                } else {
                    meta_cover = document.createElementNS(this.namespaceURI, 'meta')
                    meta_cover.setAttribute('name', 'cover')
                    const meta = opf.dom?.querySelector('metadata')
                    meta?.appendChild(document.createTextNode('\n'))
                    meta?.appendChild(meta_cover)
                }
                meta_cover.setAttribute('content', content ?? filename(path))
                this.save_opf()

                // TODO: 添加cover.xhtml文件
            }
        },
        save_opf() {
            const code = domToXml(opf.dom!).replace(/\n\s*\n\s*\n/g, '\n\n')
            invoke_write_text(this.dir, this.opf_id, code).then(() => {
                if (activity_nodes.opened_node && activity_nodes.opened_node.id.endsWith(this.opf_id)) {
                    this.current.code = code
                }
                notif_positive('完成')
                this.is_writing = false
            }, () => {
                notif_negative('发生错误！')
            })  
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
            this.nodes[TREE.HTML].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-html', type: 'html' })
        },
        add_css(name: string) {
            this.nodes[TREE.STYLE].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-css', type: 'css' })
        },
        add_image(name: string) {
            this.nodes[TREE.IMAGE].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-image', type: 'image' })
        },
        add_font(name: string) {
            this.nodes[TREE.FONT].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-font', type: 'font' })
        },
        add_js(name: string) {
            this.nodes[TREE.JS].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-js', type: 'js' })
        },
        add_audio(name: string) {
            this.nodes[TREE.AUDIO].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-audio', type: 'audio' })
        },
        add_video(name: string) {
            this.nodes[TREE.VIDEO].children!.push({ id: name, name, icon: 'i-vscode-icons:file-type-video', type: 'video' })
        },
        add_other(name: string) {
            this.nodes[TREE.OTHER].children!.push({ id: name, name, icon: 'i-vscode-icons:default-file', type: 'other' })
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

            const i = this.tabs.findIndex(t => t.id === id)
            if (i !== -1) {
                this.tabs.splice(i, 1)
            }
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
                this.is_reading = true
                invoke_get_text(node.id, this.dir).then(payload => {
                    this.set_text(payload[0], payload[1], node.id)
                    this.display = DISPLAY.CODE
                }, () => {
                    notif_negative('缓存文件被删除，请重新打开EPUB。')
                })
            } else if (is_image(node.id)) {
                this.set_src(node.id)

                // this.display = DISPLAY.IMAGE 移至ImageViewer.vue
            } else if (node.id === 'metadata') {
                this.metadata = []
                this.parse_cover()
                this.parse_metadata()
                this.display = DISPLAY.METADATA
            }
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
            this.nav_href = ''
            this.nav_in_spine = false
            invoke_clean_cache(this.dir)
            this.dir = ''
        },
    },
})

export { useStatus }
