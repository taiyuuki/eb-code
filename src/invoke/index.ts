import type { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
import type { Event } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { Language } from '@/editor/shiki'
import type { EpubContent, SearchResult } from '@/components/types'

const changed = reactive({ dirty: false })

class InvokeRequest<Payload, Error = string> {
    resolve: (value: Payload | PromiseLike<Payload>)=> void
    reject: (reason?: Error)=> void

    constructor(sucess_type: string, error_type: string) {
        this.resolve = () => {}
        this.reject = () => {}
        listen(sucess_type, (event: Event<Payload>) => {
            this.resolve(event.payload)
        })
        listen(error_type, (event: Event<Error>) => {
            this.reject(event.payload)
        })
    }

    invoke(type: string, args?: InvokeArgs, option?: InvokeOptions) {
        return new Promise<Payload>((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject   
            invoke(type, args, option)
        })
    }
}

// 启动时打开文件
const invoke_setup = function() {
    const ir = new InvokeRequest<EpubContent>('setup', 'setup-error')
 
    return function() {

        return ir.invoke('open_epub_on_setup')
    }
}()

// 打开EPUB
const invoke_open_epub = function() {
    const ir = new InvokeRequest<EpubContent>('epub-opened', 'epub-open-error')

    return function(path: string) {
        return ir.invoke('open_epub', { path })
    }
}()

// 新建EPUB
const invoke_create_epub = function() {
    const ir = new InvokeRequest<EpubContent>('epub-created', 'epub-create-error')

    return function(version: number) {
        return ir.invoke('create', { version })
    }
}()

// 保存EPUB
const invoke_save_epub = function() {
    type Payload = undefined
    const ir = new InvokeRequest<Payload>('epub-saved', 'epub-save-error')

    return function(input_dir: string, output_dir: string) {
        changed.dirty = false

        return ir.invoke('save_epub', { saveOption: { input_dir, output_dir } })
    }
}()

// 获取Text文本
const invoke_get_text = function() {
    type Payload = [string, Language, string]
    const ir = new InvokeRequest<Payload>('get-text', 'get-text-error')

    return function(path: string, dir: string) {
        
        return ir.invoke('get_text', { textDirectory: { dir, path } })
    }
}()

// 写入文本
const invoke_write_text = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('text-written', 'text-write-error')

    return function(dir: string, path: string, content: string) {
        if (!changed.dirty) {
            changed.dirty = true
        }

        return ir.invoke('write_text', { textContents: { dir, path, content } })
    }
}()

// 清除EPUB缓存
const invoke_clean_cache = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('cleaned', 'clean-error')

    return function(dir: string) {
        return ir.invoke('clean_cache', { dir })
    }
}()

// 添加文件 （将文件复制到缓存路径）
const invoke_copy_file = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('file-copied', 'file-copy-error')

    return function(from: string, dir: string, id: string) {
        if (!changed.dirty) {
            changed.dirty = true
        }

        return ir.invoke('copy_file', { copyOption: { dir, from, to_id: id } })
    }
}()

// 删除文件
const invoke_remove_file = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('file-removed', 'file-remove-error')

    return function(dir: string, id: string) {
        if (!changed.dirty) {
            changed.dirty = true
        }

        return ir.invoke('remove_file', { removeOption: { path: dir, id } })
    }
}()

// 文件重命名
const invoke_rename_file = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('file-renamed', 'file-rename-error')

    return function(dir: string, id: string, new_name: string) {
        if (!changed.dirty) {
            changed.dirty = true
        }

        return ir.invoke('rename_file', { renameOption: { path: dir, id, new_name } })
    }
}()

// 搜索
const invoke_search = function() {
    type Payload = [string, SearchResult[]][]
    type SearchOption = {
        dir: string, 
        pattern: string, 
        regex?: boolean, 
        case_sensitive?: boolean,
        word?: boolean,
        multi_line?: boolean,
        dot?: boolean,
    }

    const ir = new InvokeRequest<Payload>('searched', 'search-error')

    return function(search_option: SearchOption) {
        const searchOption = Object.assign({
            regex: false, 
            case_sensitive: false,
            word: false,
            multi_line: false,
            dot: false,
        }, search_option)

        return ir.invoke('find', { searchOption })
    }
}()

// 替换
const invoke_replace = function() {
    type Payload = string
    type RelaceOption = {
        dir: string,
        pattern: string,
        regex?: boolean,
        case_sensitive?: boolean, 
        word?: boolean,
        multi_line?: boolean,
        dot?: boolean,
        replacement: string,
    }
    const ir = new InvokeRequest<Payload>('replaced', 'replace-error')

    return function(replace_option: RelaceOption) {
        if (!changed.dirty) {
            changed.dirty = true
        }
        const replaceOption = Object.assign({
            regex: false,
            case_sensitive: false, 
            word: false,
            multi_line: false,
            dot: false,
        }, replace_option)

        return ir.invoke('replace', { replaceOption })
    }
}()

// 获取预览端口
const invoke_get_port = function() {
    type Payload = number
    const ir = new InvokeRequest<Payload>('port', 'port-error')

    return function() {

        return ir.invoke('get_port')
    }
}()

// 给目录添加id
const invoke_gen_contents = function() {
    const ir = new InvokeRequest('gen-contents', 'gen-contents-error')
    
    return function(dir: string, replacement: Record<string, [string, string][]>) {
        return ir.invoke('gen_contents', { genContentsOption: { dir, ids: replacement } })
    }
}()

export {
    invoke_setup,
    invoke_open_epub,
    invoke_create_epub,
    invoke_save_epub,
    invoke_get_text,
    invoke_write_text,
    invoke_clean_cache, 
    invoke_copy_file,
    invoke_remove_file,
    invoke_rename_file,
    invoke_search,
    invoke_replace,
    invoke_get_port,
    invoke_gen_contents,
    changed,
}
