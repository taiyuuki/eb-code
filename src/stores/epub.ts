// @unocss-include
import { convertFileSrc } from '@tauri-apps/api/core'
import { arr_remove, is_empty_string, is_void, str_random } from '@taiyuuki/utils'
import { ask } from '@tauri-apps/plugin-dialog'
import { load } from 'cheerio'
import type { ContentsNode, EpubContent, FileNode } from '@/components/types'
import type { Language } from '@/editor/shiki'
import { invoke_clean_cache, invoke_copy_file, invoke_get_text, invoke_remove_file, invoke_replace, invoke_search, invoke_write_text } from '@/invoke'
import { basename, dirname, filename, join, relative } from '@/utils/path'
import { is_audio, is_font, is_html, is_image, is_scripts, is_style, is_text, is_video } from '@/utils/is'
import { get_scroll_top, scroll_to_line, scroll_top_to } from '@/editor'
import { useActivity } from '@/composables/useActivity'
import { notif_negative, notif_warning } from '@/notif'
import { domToObj, domToXml, objToDom, xmlToDom } from '@/utils/xml'
import { DISPLAY, TREE } from '@/static'
import { cover_template, ncx_template, xhtml_template } from '@/template/xhtml'
import stores from '@/stores'
import { usePreview } from '@/stores/preview'
import { fmt_html } from '@/utils/format'

/**
 * TODO: 统一变量命名
 * dir: 缓存文件夹名称
 * id: EPUB内文件路径
 * manifest_id: manifest中的id
 * href: EPUB内文件相对opf的路径
 */

const activity_nodes = useActivity()

const preview = usePreview(stores)

function tree_index(name: string) {
    if (is_html(name)) {
        return TREE.HTML
    }
    else if (is_style(name)) {
        return TREE.STYLE
    }
    else if (is_image(name)) {
        return TREE.IMAGE
    }
    else if (is_font(name)) {
        return TREE.FONT
    }
    else if (name.endsWith('.js')) {
        return TREE.JS
    }
    else if (is_audio(name)) {
        return TREE.AUDIO
    }
    else if (is_video(name)) {
        return TREE.VIDEO
    }
    else {
        return TREE.OTHER
    }
}

const opf = {
    dom: null as Document | null,
    namespaceURI: 'http://www.idpf.org/2007/opf',
}
const contents = {
    dom: null as Document | null, 
    namespaceURI: 'http://www.daisy.org/z3986/2005/ncx/',
}

const useEPUB = defineStore('epub', { 
    state: () => ({
        nodes: [] as FileNode[],
        opf_id: '', // opf文件路径，即container.xml里的filepath
        nav_href: '', // 导航文件路径
        nav_manifest_id: '', // 导航文件id
        tabs: [] as FileNode[], // 打开的标签
        image_srces: {} as Record<string, string>, // 图片src
        save_path: '', // epub保存路径
        current: {
            id: '', // 打开文件的id，例如META-INF/container.xml
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
        version: '2.0', // EPUB版本
        metadata: [] as Record<string, any>[], // EPUB元数据
        meta_is_dirty: false,
        opf_is_dirty: false,
        cover_src: '',
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
        nav_version: 2 as 2 | 3,
        contents_tree: [] as ContentsNode[],
        contents_links: [] as FileNode[],
        contents_id_lnum: {} as Record<string, number>,
    }),
    getters: {

        // EPUB文件名
        file_name(state) {
            return filename(state.save_path || 'Unnamed.epub')
        },
        book_id(state) {
            return state.metadata.find(m => m.tagName === 'dc:identifier')?.textContent || ''
        },
        book_title(state) {
            return state.metadata.find(m => m.tagName === 'dc:title')?.textContent || ''
        },
        editable(state) {
            return state.dir !== ''
        },
        flat_nodes(state) {
            const flat = {} as Record<string, FileNode>
            state.nodes.forEach(node => {
                flat[node.id] = node
                if (node.children) {
                    node.children.forEach(child => {
                        flat[child.id] = child
                    })
                }
            })

            return flat
        },
    },
    actions: {
        parse(payload: EpubContent) {
            
            const dom = xmlToDom(payload.container)
            const rootfile = dom.getElementsByTagName('rootfile')[0]
            this.opf_id = rootfile.getAttribute('full-path') || ''
            this.dir = payload.dir
            this.base_path = payload.base_path

            this.init_tree()

            payload.chapters.forEach(name => {
                const file = payload.paths.find(f => f === name)
                if (file) {
                    this.add_html(file)
                }
            })

            payload.paths.forEach(file => {
                const name = file.toLowerCase()
                if (is_html(name)) {
                    return
                }
                else if (name.endsWith('.js')) {
                    this.add_js(file)
                }
                else if (is_style(name)) {
                    this.add_css(file)
                }
                else if (is_image(name)) {
                    this.add_image(file)
                }
                else if (is_audio(name)) {
                    this.add_audio(file)
                }
                else if (is_font(name)) {
                    this.add_font(file)
                }
                else if (name.endsWith('.opf')) {
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-text', type: 'opf' })
                }
                else if (name.endsWith('.ncx')) {
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-text', type: 'ncx' })
                }
                else if (file === 'mimetype' || file === 'META-INF/container.xml') {
                    return
                }
                else {
                    this.add_other(file)
                }
            })

            this.add_parent()
            const root_path = dirname(this.opf_id)
            this.manifest_path = root_path === '' ? '' : `${root_path}/`

            const get_sub_path = (path: string) => {
                const file_name = basename(path)

                return path.replace(this.manifest_path, '').replace(file_name, '')
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
            this.load_contents_link()
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
                await this.parse_contents()
            }
        },
        async reload_opf() {
            if (this.opf_id !== '') {
                const payload = await invoke_get_text(this.opf_id, this.dir)
                opf.dom = xmlToDom(payload[0])
            }
        },
        parse_namespaceURI() {
            if (opf.dom) {
                opf.namespaceURI = opf.dom.documentElement.namespaceURI ?? opf.namespaceURI
            }
        },
        parse_version() {
            if (opf.dom) {
                const package_node = opf.dom.querySelector('package')
                this.version = package_node?.getAttribute('version') || '2.0'
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
                }
                else {
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
                }
                else {
                    this.cover_src = ''
                }
                
            }
        },
        parse_metadata() {
            if (opf.dom) {
                this.metadata.length = 0
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
                        }
                        else {
                            this.metadata.push(domToObj(node))
                        }
                    })
                }
            }
        },
        parse_nav() {
            if (this.version.startsWith('3')) {
                const item = opf.dom?.querySelector('item[properties="nav"]')
                this.nav_href = item?.getAttribute('href') || ''
                this.nav_manifest_id = item?.getAttribute('id') || ''
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
                }
                else {
                    this.nodes.push({ id: file, name: file, icon: 'i-vscode-icons:file-type-pddl-happenings', type: 'navigation' })
                    this.nav_in_spine = false
                }
            }
            
        },
        async parse_contents() {
            const payload = await invoke_get_text(`${this.manifest_path}${this.nav_href}`, this.dir)
            contents.dom = xmlToDom(payload[0])

            contents.namespaceURI = contents.dom.documentElement.namespaceURI || contents.namespaceURI
            
            this.contents_tree.length = 0

            if (this.nav_version === 3) {
                const navs = contents.dom.querySelectorAll('nav')
                const ol = Array.from(navs).find(nav => nav.getAttribute('epub:type') === 'toc')
                    ?.querySelector('ol') 

                const loop_stack: [Element | null | undefined, ContentsNode[], parent: ContentsNode | null][] = [[ol, this.contents_tree, null]]
                while (loop_stack.length) {
                    const [ol, tree, parent] = loop_stack.pop()!
                    const lis = Array.from(ol?.children || []).filter(node => node.nodeName === 'li')
                    if (lis) {
                        lis.forEach(li => {
                            const a = li.querySelector('a')
                            const title = a?.textContent || ''
                            const href = a?.getAttribute('href') || './'
                            const id = join(dirname(this.nav_href), `${this.manifest_path}${href}`)

                            const branch: ContentsNode = {
                                title,
                                id,
                            }

                            if (parent) {
                                branch.parent = parent
                            }
                            
                            const ol = li.querySelector('ol')
                            tree.push(branch)

                            if (ol) {
                                tree[tree.length - 1].children = []
                                loop_stack.push([ol, tree[tree.length - 1].children!, branch])
                                branch.expanded = true
                            }
                        })
                    }
                }
            }
            else {
                const navMap = contents.dom.querySelector('navMap')
                const loop_stack: [Element | null, ContentsNode[], parent: ContentsNode | null][] = [[navMap, this.contents_tree, null]]
                while (loop_stack.length) {
                    const [navMap, tree, parent] = loop_stack.pop()!
                    const points = Array.from(navMap?.children || []).filter(node => node.nodeName === 'navPoint')
                    if (points) {
                        points.forEach(nav => {
                            const title = nav.querySelector('text')?.textContent || ''
                            const href = nav.querySelector('content')?.getAttribute('src') || './'
                            const id = join(dirname(this.nav_href), `${this.manifest_path}${href}`)

                            const branch: ContentsNode = {
                                title,
                                id,
                            }

                            if (parent) {
                                parent.expanded = true
                                branch.parent = parent
                            }
                            tree.push(branch)
                            
                            const navMap = nav.querySelector('navPoint')
                            if (navMap) {
                                tree[tree.length - 1].children = []
                                loop_stack.push([nav, tree[tree.length - 1].children!, branch])
                            }
                        })
                    }   
                }
            }
        },
        async load_contents_link() {
            const result = await invoke_search(
                this.dir,
                'id=".*?"',
                true,
                false,
                false,
                false,
                false,
            )
            this.contents_links.length = 0
            this.nodes[TREE.HTML]?.children?.forEach(node => {
                this.contents_links.push(node)
                const n = result.find(r => r[0] === node.id)
                if (n) {
                    const reg = /id="(.*?)"/
                    n[1].forEach(r => {
                        const id = `${node.id}#${reg.exec(r.line)![1]}`
                        this.contents_id_lnum[id] = r.lnum
                        this.contents_links.push({
                            id,
                            name: id,
                        })
                    })
                }
            })
        },
        async get_contents_header() {
            const result = await invoke_search(
                this.dir,
                '<h\\d.*?>.*?</h\\d>',
                true,
                false,
                false,
                true,
                true,
            )
            const nodes: ContentsNode[] = []
            const reg = /(<h\d.*?)(>.*?<\/h\d>)/g
            const map = new WeakMap()

            let pre: ContentsNode | undefined = undefined
            const replacement: Record<string, [string, string][]> = {}
            this.nodes[TREE.HTML]?.children?.forEach(node => {
                const xhtml_file = result.find(r => r[0] === node.id)
                if (xhtml_file) { 
                    const manifest_id = xhtml_file[0]
                    xhtml_file[1].forEach((r, i) => {
                        let match = reg.exec(r.line)
                        while(match) {
                            const line = match[0]
                            const $ = load(line)
                            let c = 1
                            let $h = $(`h${c}`)
                            while (is_void($h.html())) {
                                $h = $(`h${++c}`)
                            }
    
                            let id = $h.attr('id')
                            const title = $h.attr('title') ?? $h.text()
                            if (is_empty_string(title, true)) {
                                return
                            }
                            const node: ContentsNode = {
                                id: manifest_id,
                                title,
                            }
                            if (i > 0) {
                                if (!id) {
                                    id = `ebook-${str_random(7, 36)}`
                                    if (!replacement[manifest_id]) {
                                        replacement[manifest_id] = []
                                    }
                                    replacement[manifest_id].push([match[0], `${match[1]} id="${id}"${match[2]}`])
                                }
                                node.id += `#${id}`
                            }
                        
                            if (pre) {
                                let pre_h = map.get(pre)
                                if (pre_h < c) {
                                    if (!pre.children) {
                                        pre.children = []
                                        pre.expanded = true
                                    }
                                    node.parent = pre
                                    pre.children.push(node)
                                }
                                else {
                                    while (pre_h > c) {
                                        pre = pre?.parent
                                        pre_h = pre ? map.get(pre) : 0
                                    }
                                    pre = pre?.parent
                                    if (pre) {
                                        if (!pre.children) {
                                            pre.children = []
                                            pre.expanded = true
                                        }
                                        node.parent = pre
                                        pre.children.push(node)
                                    }
                                    else {
                                        nodes.push(node)
                                    }
                                }
                            }
                            else {
                                nodes.push(node)
                            }
                            pre = node
                            map.set(node, c)
                            match = reg.exec(r.line)
                        }
                    
                    })
                }
            })

            return {
                nodes,
                replacement,
            }
        },
        parse_guide() {
            
        },
        get_nav_epub2(dom: Document, namespaceURI: string) {
            const navMap = document.createElementNS(namespaceURI, 'navMap')
            navMap.appendChild(document.createTextNode('\n'))
            const loop_stack: [Element, ContentsNode][] = []
            for (let i = this.contents_tree.length - 1; i >= 0; i--) {
                loop_stack.push([navMap, this.contents_tree[i]])
            }
                
            let index = 1
            while (loop_stack.length) {
                const [navMap, node] = loop_stack.pop()!
                const navPoint = document.createElementNS(namespaceURI, 'navPoint')
                navPoint.appendChild(document.createTextNode('\n'))
                const text = document.createElementNS(namespaceURI, 'text')
                text.textContent = node.title

                navPoint.setAttribute('id', `navPoint-${index}`)
                navPoint.setAttribute('playOrder', `${index}`)
                    
                const label = document.createElementNS(namespaceURI, 'navLabel')
                label.appendChild(text)
                navPoint.appendChild(label)

                const content = document.createElementNS(namespaceURI, 'content')
                content.setAttribute('src', node.id.replace(this.manifest_path, ''))

                navPoint.appendChild(document.createTextNode('\n'))
                navPoint.appendChild(content)
                navPoint.appendChild(document.createTextNode('\n'))

                navMap.appendChild(navPoint)
                navMap.appendChild(document.createTextNode('\n'))

                index++
                if (node.children?.length) {
                    for (let i = node.children.length - 1; i >= 0; i--) {
                        loop_stack.push([navPoint, node.children[i]])
                    }
                }
            }

            dom.querySelector('navMap')?.replaceWith(navMap)

            return domToXml(dom, 'xml')
        },
        get_nav_epub3(dom: Document) {
            const ol = document.createElement('ol')
            const loop_stack: [HTMLOListElement, ContentsNode[]][] = [[ol, this.contents_tree]]

            ol.appendChild(document.createTextNode('\n'))
            while (loop_stack.length) {
                const [ol, tree] = loop_stack.pop()!
                tree.forEach(node => {
                    const li = document.createElement('li')
                    li.appendChild(document.createTextNode('\n'))
                    const a = document.createElement('a')
                    a.textContent = node.title
                    a.href = node.id.replace(this.manifest_path, '')
                    li.appendChild(a)
                    li.appendChild(document.createTextNode('\n'))
                    ol.appendChild(li)
                    ol.appendChild(document.createTextNode('\n'))
                    if (node.children?.length) {
                        const ol = document.createElement('ol')
                        li.appendChild(ol)
                        loop_stack.push([ol, node.children])
                    }
                })
                    
            }

            dom
                ?.querySelector('nav[id="toc"]')
                ?.querySelector('ol')
                ?.replaceWith(ol)

            return domToXml(dom)
        },
        async save_contents() {
            const contents_xml = this.nav_version === 2 
                ? this.get_nav_epub2(contents.dom!, contents.namespaceURI) 
                : this.get_nav_epub3(contents.dom!)

            const code = fmt_html(contents_xml)
            
            if (activity_nodes.opened_node?.type === 'navigation') {
                this.is_toogle = true
                this.current.code = code
            }
            
            await invoke_write_text(this.dir, `${this.manifest_path}${this.nav_href}`, code)
        },
        async gen_ncx_for_epub2() {
            const conf = await ask('此操作是为了兼容ePub2，如果你后续修改了导航文件，你可能需要重新执行此操作，是否继续？', {
                title: '提示',
                okLabel: '是',
                cancelLabel: '否',
            })
            if (!conf) return
            const dom = xmlToDom(ncx_template(this.book_id))
            const contents_xml = fmt_html(this.get_nav_epub2(dom, 'http://www.idpf.org/2007/ops')) 

            let ncx_manifest_id = join(this.manifest_path, 'toc.ncx')
            const spine_node = opf.dom?.querySelector('spine')
            const ncx_$id = spine_node?.getAttribute('toc') ?? 'ncx'
            spine_node?.setAttribute('toc', ncx_$id)
            
            const item = opf.dom?.querySelector(`item[id="${ncx_$id}"]`)
            if (item) {
                const href = item.getAttribute('href')
                if (href) { 
                    ncx_manifest_id = join(this.manifest_path, href)
                }
                else {
                    item.setAttribute('href', 'toc.ncx')
                }
            }
            else {
                opf.dom?.querySelector('manifest')?.appendChild(document.createTextNode('\n'))
                opf.dom?.querySelector('manifest')?.appendChild(objToDom({ 'tagName': 'item', 'id': 'ncx', 'href': 'toc.ncx', 'type': 'ncx', 'media-type': 'application/x-dtbncx+xml' }, opf.namespaceURI))
            }

            await invoke_write_text(this.dir, ncx_manifest_id, contents_xml)

            if (this.current.id === ncx_manifest_id) {
                await this.reload_current()
            }

            const navs = contents.dom?.querySelectorAll('nav')
            const ol = Array.from(navs ?? []).find(nav => nav.getAttribute('epub:type') === 'landmarks')
                ?.querySelector('ol') 
            if (ol) {
                const lis = Array.from(ol.querySelectorAll('li'))
                const guide = document.createElementNS(opf.namespaceURI, 'guide')
                guide.appendChild(document.createTextNode('\n'))
                lis.forEach(li => {
                    const a = li.querySelector('a')
                    const type = a?.getAttribute('epub:type')
                    const href = a?.getAttribute('href')
                    const text = a?.textContent

                    const reference = document.createElementNS(opf.namespaceURI, 'reference')
                    reference.setAttribute('type', type || 'text')
                    reference.setAttribute('title', text || '')
                    reference.setAttribute('href', href || '')
                    guide.appendChild(reference)
                    guide.appendChild(document.createTextNode('\n'))
                })
                const old_guide = opf.dom?.querySelector('guide')
                if (old_guide) {
                    old_guide.replaceWith(guide)
                }
                else {
                    opf.dom?.querySelector('package')?.appendChild(guide)
                }
            }
            await this.save_opf()
            const ncx_node = this.nodes.find(n => n.id === ncx_manifest_id)
            if (ncx_node) {
                ncx_node.id = ncx_manifest_id
                ncx_node.name = ncx_manifest_id
            }
            else {
                this.nodes.push({ id: ncx_manifest_id, name: ncx_manifest_id, icon: 'i-vscode-icons:file-type-text', type: 'ncx' })
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
        async save_meta() {
            const meta_el = opf.dom!.querySelector('metadata')!
            meta_el.innerHTML = ''
            meta_el.appendChild(document.createTextNode('\n'))

            this.metadata.forEach(m => {
                meta_el.appendChild(objToDom(m, meta_el.namespaceURI || opf.namespaceURI))
                meta_el.appendChild(document.createTextNode('\n'))
                if (m.children) {
                    m.children.forEach((c: any) => {
                        meta_el.appendChild(objToDom(c, opf.namespaceURI))
                        meta_el.appendChild(document.createTextNode('\n'))
                    })
                }
            })
            meta_el.appendChild(document.createTextNode('\n'))
            await this.save_opf()
        },
        remove_meta_child(item: Record<string, Record<string, any>[]>, child: Record<string, any>) {
            if (!item.children) {
                return
            }

            // item.children = item.children.filter(c => c !== child)
            arr_remove(item.children, child)
        },
        async add_file(from: string, manifest_id: string, href: string, mimetype: string, has?: boolean) {
            if (has) {
                delete this.image_srces[this.manifest_path + href]
            }
            else {
                const item = document.createElementNS(opf.namespaceURI, 'item')
                item.setAttribute('id', manifest_id.replace(/\s/g, '_'))
                item.setAttribute('href', href)
                item.setAttribute('media-type', mimetype)
    
                const manifest_node = opf.dom?.querySelector('manifest')
                manifest_node?.appendChild(item)
                manifest_node?.appendChild(document.createTextNode('\n'))
                if (is_html(href)) {
                    this.spine_insert_before(0, manifest_id.replace(/\s/g, '_'), true)
                }
                this.save_opf()
            }
            await invoke_copy_file(from, this.dir, `${this.manifest_path}${href}`)
        },
        get_itemref_by_id(id: string) {
            const manifest_node = opf.dom?.querySelector('manifest')
            if (manifest_node) {
                const item = manifest_node.querySelector(`item[href="${id.replace(this.manifest_path, '')}"]`)
                if (item) {
                    const manifest_id = item.getAttribute('id')

                    return opf.dom?.querySelector(`itemref[idref="${manifest_id}"]`)
                }
            }  
        },
        remove_file(node: FileNode) {
            const manifest_node = opf.dom?.querySelector('manifest')
            const spine_node = opf.dom?.querySelector('spine')
            if (manifest_node) {
                const item = manifest_node.querySelector(`item[href="${node.id.replace(this.manifest_path, '')}"]`)
                if (item) {
                    const manifest_id = item.getAttribute('id')
                    manifest_node.removeChild(item)
                    if (spine_node) {
                        const itemref = spine_node.querySelector(`itemref[idref="${manifest_id}"]`)
                        if (itemref) {
                            spine_node.removeChild(itemref)
                        }
                    }

                    // 如果是封面
                    const meta_cover = opf.dom?.querySelector('meta[name="cover"]')
                    if (meta_cover && meta_cover.getAttribute('content') === manifest_id) {
                        const meta = opf.dom?.querySelector('metadata')
                        meta?.removeChild(meta_cover)
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
            invoke_remove_file(this.dir, node.id)

        },
        async rename_file(node: FileNode, new_name: string) {
            const item = opf.dom?.querySelector(`item[href="${node.id.replace(this.manifest_path, '')}"]`)
            if (item) {
                const old_manifest_id = item?.getAttribute('id')
                const new_manifest_id = new_name.replace(/\s/g, '_')
                const old_name = node.id.replace(this.manifest_path, '')
                    
                item.setAttribute('href', new_manifest_id)
                item.setAttribute('id', new_manifest_id)

                // 重命名书脊
                const itemref = opf.dom?.querySelector(`itemref[idref="${old_manifest_id}"]`)
                if (itemref) {
                    itemref.setAttribute('idref', new_manifest_id)
                }

                // 重命名封面
                const cover_meta = opf.dom?.querySelector(`meta[content="${old_manifest_id}"]`)
                if (cover_meta) {
                    cover_meta.setAttribute('content', new_manifest_id)
                }

                this.save_opf()

                // 重命名XHTML里的资源
                if (is_image(old_name) || is_font(old_name)) {
                    await invoke_replace(
                        this.dir, 
                        old_name, 
                        false, 
                        false, 
                        false,
                        true,
                        false,
                        new_name,
                    )
                    if (this.display === DISPLAY.CODE && is_html(this.current.id)) {
                        await this.reload_current()
                    }
                }
            }
            if (this.has_src(node.id)) {
                delete this.image_srces[node.id]
            }
        },
        move(old_i: number, new_i: number) {
            const spine_node = opf.dom?.querySelector('spine')
            const children = spine_node?.children
            if (children) {
                const moved_el = children[old_i]!
                if (new_i === children.length - 1) {
                    spine_node.appendChild(spine_node.removeChild(moved_el))
                    spine_node.appendChild(document.createTextNode('\n'))
                }
                else {
                    const target_el = children[new_i < old_i ? new_i : new_i + 1]!
                    spine_node?.insertBefore(spine_node?.removeChild(moved_el), target_el)
                    spine_node?.insertBefore(document.createTextNode('\n'), target_el)
                }
                
                this.save_opf()
            }
        },
        add_spine(manifest_id: string, linear: boolean) {
            const spine_node = opf.dom!.querySelector('spine')
            const itemref = document.createElementNS(opf.namespaceURI, 'itemref')
            itemref.setAttribute('idref', manifest_id)
            itemref.setAttribute('linear', linear ? 'yes' : 'no')
            spine_node?.appendChild(itemref)
            spine_node?.appendChild(document.createTextNode('\n'))
            this.opf_is_dirty = true
        },
        spine_insert_before(position: number, manifest_id: string, linear: boolean, properties?: Record<string, string>) {
            const spine_node = opf.dom!.querySelector('spine')
            const itemref = document.createElementNS(opf.namespaceURI, 'itemref')
            itemref.setAttribute('idref', manifest_id)
            itemref.setAttribute('linear', linear ? 'yes' : 'no')
            if (properties) {
                for (const [key, value] of Object.entries(properties)) {
                    itemref.setAttribute(key, value)
                }
            }
            const children = spine_node?.children
            if (children && position < children.length) {
                spine_node?.insertBefore(itemref, children[position])
                spine_node?.insertBefore(document.createTextNode('\n'), children[position + 1])
            }
            else {
                spine_node?.appendChild(itemref)
                spine_node?.appendChild(document.createTextNode('\n'))
            }
            this.opf_is_dirty = true
        },
        get_spine() {
            const spine_node = opf.dom!.querySelector('spine')
            const list: { manifest_id: string, linear: boolean }[] = []
            spine_node?.querySelectorAll('itemref').forEach(item => {
                const manifest_id = item.getAttribute('idref')
                if (manifest_id) {
                    list.push({ manifest_id, linear: item.getAttribute('linear') === 'yes' })
                }
            })

            return list
        },
        get_spine_ppd() {
            return opf.dom?.querySelector('spine')?.getAttribute('page-progression-direction') ?? null
        },
        set_spine_ppd(value: string) {
            const spine_node = opf.dom!.querySelector('spine')
            if (spine_node) {
                spine_node.setAttribute('page-progression-direction', value)
            }
            this.opf_is_dirty = true
        },
        get_metadata_xml() {
            return opf.dom?.querySelector('metadata')?.innerHTML
        },
        set_metadata_xml(xml: string) {
            const metadata = opf.dom!.querySelector('metadata')
            if (metadata) {
                metadata.innerHTML = xml
            }
            this.opf_is_dirty = true
        },
        get_package_tag() {
            const pkg_el = opf.dom?.querySelector('package')
            const pkg_tag: Record<string, string> = {}
            if (pkg_el) {
                for (let i = 0; i < pkg_el.attributes.length; i++) {
                    pkg_tag[pkg_el.attributes[i].name] = pkg_el.attributes[i].value
                }
            }

            return pkg_tag
        },
        set_package_tag(new_tag: Record<string, string>) {
            const package_node = opf.dom!.querySelector('package')
            if (package_node) {
                for (const [key, value] of Object.entries(new_tag)) {
                    package_node.setAttribute(key, value)
                }
            }
            this.opf_is_dirty = true
        },
        add_nav_to_spine() {
            const spine_node = opf.dom!.querySelector('spine')
            if (this.nav_in_spine) {
                this.spine_insert_before(0, this.nav_manifest_id, true, { properties: 'nav' })
            }
            else {
                const nav_item = opf.dom!.querySelector(`itemref[idref="${this.nav_manifest_id}"]`)
                if (nav_item) {
                    spine_node?.removeChild(nav_item)
                }
            }
            this.save_opf()
        },
        async set_cover(path: string) {
            if (this.has_src(path)) {
                this.cover_src = this.image_srces[path]
            }
            else {
                const src = convertFileSrc(this.base_path + path)
                this.cover_src = src
                this.image_srces[path] = src

            }
            const img = new Image()
            img.src = this.cover_src
            const id = `${this.manifest_path + this.text_path}cover.xhtml`
            const xhtml_href = relative(id, this.opf_id)
            img.onload = () => {
                const href = relative(path, id)
                const { naturalWidth, naturalHeight } = img
                const xhtml = fmt_html(cover_template(naturalWidth, naturalHeight, href)) 
                const cc = this.nodes[TREE.HTML].children!.find(n => n.id === id)
                invoke_write_text(this.dir, id, xhtml).then(() => {
                    if (cc) {
                        if (cc.open) {
                            this.current.code = xhtml
                        }
                    }
                    else {
                        this.nodes[TREE.HTML].children?.unshift({
                            id,
                            name: id,
                            icon: 'i-vscode-icons:file-type-html',
                            parent: this.nodes[TREE.HTML],
                        })
                    }
                    this.add_tab(this.nodes[TREE.HTML].children![0])
                    this.open(this.nodes[TREE.HTML].children![0])
                })
            }

            const old_items = opf.dom?.querySelectorAll('item[properties="cover-image"]')
            if (old_items) {
                old_items.forEach(i => i.removeAttribute('properties'))
            }

            const cover_href = path.replace(this.manifest_path, '')
            const item_cover = opf.dom?.querySelector(`item[href="${cover_href}"`)
            if (item_cover) {
                item_cover.setAttribute('properties', 'cover-image')
                const content = item_cover.id
                let meta_cover = opf.dom?.querySelector('meta[name="cover"]')
                if (!meta_cover) {
                    
                    meta_cover = document.createElementNS(opf.namespaceURI, 'meta')
                    meta_cover.setAttribute('name', 'cover')
                    const meta = opf.dom?.querySelector('metadata')
                    meta?.appendChild(document.createTextNode('\n'))
                    meta?.appendChild(meta_cover)
                    
                }
                meta_cover.setAttribute('content', content ?? filename(path))
            }

            let manifest_id = `${this.text_path}cover.xhtml`
            let item_xhtml = opf.dom?.querySelector(`item[href="${manifest_id}"]`)
            const manifest = opf.dom?.querySelector('manifest')
            if (!item_xhtml) {
                item_xhtml = document.createElementNS(opf.namespaceURI, 'item')
                manifest?.appendChild(document.createTextNode('\n'))
                manifest?.appendChild(item_xhtml)
                item_xhtml.setAttribute('id', manifest_id)
                item_xhtml.setAttribute('href', manifest_id)
                item_xhtml.setAttribute('media-type', 'application/xhtml+xml')
            }
            manifest_id = item_xhtml.getAttribute('id') || manifest_id

            let itemref_cover = opf.dom?.querySelector(`itemref[idref="${manifest_id}"]`)
            if(!itemref_cover) {
                itemref_cover = document.createElementNS(opf.namespaceURI, 'itemref')
                itemref_cover.setAttribute('idref', manifest_id)
                itemref_cover.setAttribute('linear', 'yes')
                const spine = opf.dom?.querySelector('spine')
                const first_child = spine?.children[0]
                if (first_child) {
                    spine.insertBefore(document.createTextNode('\n'), first_child)
                    spine.insertBefore(itemref_cover, first_child)
                }
                else {
                    spine?.appendChild(document.createTextNode('\n'))
                    spine?.appendChild(itemref_cover)
                }
            }

            if (this.nav_version === 3) {
                const navs = contents.dom?.querySelectorAll('nav')
                const ol = Array.from(navs ?? []).find(nav => nav.getAttribute('epub:type') === 'landmarks')
                    ?.querySelector('ol') 
                let li_cover = Array.from(ol?.children ?? []).find(li => li.getAttribute('epub:type') === 'cover')
                const a = document.createElementNS(contents.namespaceURI, 'a')
                a.setAttribute('href', xhtml_href)
                a.textContent = 'Cover'
                if (li_cover) {
                    li_cover.innerHTML = ''
                }
                else {
                    li_cover = document.createElementNS(contents.namespaceURI, 'li')
                    ol?.appendChild(li_cover)
                }
                li_cover.appendChild(a)
                const contents_xml = fmt_html(domToXml(contents.dom!)) 
                await invoke_write_text(this.dir, `${this.manifest_path}${this.nav_href}`, contents_xml)
            }
            else {
                let guide_node = opf.dom?.querySelector('guide')
                if (!guide_node) {
                    guide_node = document.createElementNS(opf.namespaceURI, 'guide')
                    const root_node = opf.dom?.querySelector('package')
                    root_node?.appendChild(guide_node)
                } 
                let reference_cover = guide_node.querySelector('reference[type="cover"]')
                if (!reference_cover) {
                    reference_cover = document.createElementNS(opf.namespaceURI, 'reference')
                    guide_node.appendChild(reference_cover)
                    guide_node.appendChild(document.createTextNode('\n'))
                }
                reference_cover.setAttribute('type', 'cover')
                reference_cover.setAttribute('title', 'cover')
                reference_cover.setAttribute('href', xhtml_href)
            }

            await this.save_opf()
        },
        async new_html(i: number, id: string) {
            const xhtml = fmt_html(xhtml_template()) 
            await invoke_write_text(this.dir, id, xhtml)
            this.nodes[TREE.HTML].children?.splice(i + 1, 0, {
                id,
                name: id,
                icon: 'i-vscode-icons:file-type-html',
                type: 'html',
                parent: this.nodes[TREE.HTML],
            })
            this.add_tab(this.nodes[TREE.HTML].children![i + 1])
            this.open(this.nodes[TREE.HTML].children![i + 1])

            const manifest_node = opf.dom?.querySelector('manifest')
            const manifest_id = basename(id).replace(/\s/g, '_')
            if (manifest_node) {
                const item = document.createElementNS(opf.namespaceURI, 'item')
                manifest_node.appendChild(document.createTextNode('\n'))
                item.setAttribute('id', manifest_id)
                item.setAttribute('href', relative(id, this.opf_id))
                item.setAttribute('media-type', 'application/xhtml+xml')
                manifest_node.appendChild(item)
            }
            this.spine_insert_before(i + 1, manifest_id, true)
            await this.save_opf()
        },
        async new_css(id: string) {
            const css = '@charset "UTF-8";\n'
            await invoke_write_text(this.dir, id, css)
            this.nodes[TREE.STYLE].children?.push({
                id: id,
                name: id,
                icon: 'i-vscode-icons:file-type-css',
                type: 'css',
                parent: this.nodes[TREE.STYLE],
            })
            this.add_tab(this.nodes[TREE.STYLE].children!.at(-1)!)
            this.open(this.nodes[TREE.STYLE].children!.at(-1)!)

            const manifest_node = opf.dom?.querySelector('manifest')
            if (manifest_node) {
                const item = document.createElementNS(opf.namespaceURI, 'item')
                manifest_node.appendChild(document.createTextNode('\n'))
                item.setAttribute('id', basename(id).replace(/\s/g, '_'))
                item.setAttribute('href', relative(id, this.opf_id))
                item.setAttribute('media-type', 'text/css')
                manifest_node.appendChild(item)

                this.save_opf()
            }
        },
        async save_opf() {
            const code = fmt_html(domToXml(opf.dom!, 'xml').replace(/\n\s*\n\s*\n/g, '\n\n')) 
            if (activity_nodes.opened_node?.type === 'opf') {
                this.is_toogle = true
                this.current.code = code
            }
            await invoke_write_text(this.dir, this.opf_id, code)
            if (this.display === DISPLAY.CODE && this.current.id === this.opf_id) {
                await this.reload_current()
            }
            this.opf_is_dirty = false
        },
        init_tree() {
            this.nodes = [{
                id: 'text',
                name: 'Text',
                get icon() {
                    return this.expanded ? 'i-vscode-icons:folder-type-view-opened' : 'i-vscode-icons:folder-type-view'
                },
                children: [],
                expanded: true,
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
            this.nodes.length = 0
        },
        get_id(manifest_id: string) {
            const id = opf.dom?.querySelector(`item[id="${manifest_id}"]`)?.getAttribute('href')

            return id ? this.manifest_path + id : null
        },
        add_html(name: string) {
            const item = { 
                id: name,
                name,
                icon: 'i-vscode-icons:file-type-html', 
                type: 'html',
                parent: this.nodes[TREE.HTML],
            }
            this.nodes[TREE.HTML].children!.push(item)
        },
        add_css(name: string) {
            const item = {
                id: name, 
                name, 
                icon: 'i-vscode-icons:file-type-css',
                type: 'css',
                parent: this.nodes[TREE.STYLE],
            }
            this.nodes[TREE.STYLE].children!.push(item)
        },
        add_image(name: string) {
            const item = {
                id: name,
                name,
                icon: 'i-vscode-icons:file-type-image',
                type: 'image', 
                parent: this.nodes[TREE.IMAGE],
            }
            this.nodes[TREE.IMAGE].children!.push(item)
        },
        add_font(name: string) {
            const item = {
                id: name, 
                name,
                icon: 'i-vscode-icons:file-type-font',
                type: 'font', 
                parent: this.nodes[TREE.FONT],
            }
            this.nodes[TREE.FONT].children!.push(item)
        },
        add_js(name: string) {
            const item = {
                id: name,
                name,
                icon: 'i-vscode-icons:file-type-js',
                type: 'js',
                parent: this.nodes[TREE.JS],
            }
            this.nodes[TREE.JS].children!.push(item)
        },
        add_audio(name: string) {
            const item = {
                id: name,
                name,
                icon: 'i-vscode-icons:file-type-audio',
                type: 'audio',
                parent: this.nodes[TREE.AUDIO],
            }
            this.nodes[TREE.AUDIO].children!.push(item)
        },
        add_video(name: string) {
            const item = {
                id: name,
                name,
                icon: 'i-vscode-icons:file-type-video',
                type: 'video',
                parent: this.nodes[TREE.VIDEO],
            }
            this.nodes[TREE.VIDEO].children!.push(item)
        },
        add_other(name: string) {
            const item = {
                id: name,
                name,
                icon: 'i-vscode-icons:default-file',
                type: 'other',
                parent: this.nodes[TREE.OTHER],
            }
            this.nodes[TREE.OTHER].children!.push(item)
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

            // TODO: 增加其他文件类型的预览
            if (is_text(node.id) || is_image(node.id) || is_style(node.id) || node.type === 'metadata' || is_scripts(node.id)) {
                this.tabs.push(node)
            }
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
            }
            else {
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
        },
        async open(node: FileNode, lnum?: number, hash?: string) {
            if (is_html(node.id)) {
                preview.id = ''
                preview.id = node.id + (hash ?? '')
            }

            // 如果是同一个节点，不操作
            if (this.is_reading || this.is_opening || this.is_saving) {
                notif_warning('程序繁忙, 请稍等片刻后再试！')

                return
            }
            if (activity_nodes.opened_node === node && !lnum) {

                return
            }
            this.add_tab(node)

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
                try {
                    const payload = await invoke_get_text(node.id, this.dir)
                    this.set_text(payload[0], payload[1], node.id)
                    this.display = DISPLAY.CODE
                    if (lnum) {
                        scroll_to_line(lnum)
                    }
                    else {
                        scroll_top_to(this.get_top(node.id))
                    }
                }
                catch (e) {
                    console.error(e)
                    notif_negative('缓存文件被删除，请重新打开EPUB。')
                }
            }
            else if (is_image(node.id)) {
                this.set_src(node.id)

                // this.display = DISPLAY.IMAGE 移至ImageViewer.vue
            }
            else if (node.id === 'metadata') {
                this.parse_cover()
                this.parse_metadata()
                this.display = DISPLAY.METADATA
            }
        },
        async reload_current() {
            await this.open_by_id(this.current.id, 1)
        },
        async open_by_id(id: string, lnum?: number, hash?: string) {
            if (id in this.flat_nodes) {
                const node = this.flat_nodes[id]
                await this.open(node, lnum, hash)
                this.add_tab(node)
            }
        },
        async follow_link(url: string) {
            const id = join(dirname(this.current.id), url)
            this.open_by_id(id)
        },
        close_epub() {
            this.display = DISPLAY.NONE
            this.current.code = ''
            this.current.src = ''
            this.current.id = ''
            this.current.lang = 'xhtml'
            this.tabs.length = 0
            this.image_srces = {}
            this.scroll_tops = {}
            this.meta_is_dirty = false
            this.opf_is_dirty = false
            this.is_toogle = false
            this.save_path = ''
            this.metadata.length = 0    
            this.nav_href = ''
            this.nav_in_spine = false
            this.contents_tree.length = 0
            this.contents_id_lnum = {}
            this.contents_links.length = 0
            this.is_reading = false
            preview.clean()
            this.dir && invoke_clean_cache(this.dir)
            this.dir = ''
        },
    },
})

export { useEPUB }
