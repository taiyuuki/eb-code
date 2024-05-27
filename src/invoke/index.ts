import type { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
import type { Event } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { Language } from '@/editor/shiki'
import type { SearchResult } from '@/components/types'

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

// 打开EPUB
const invoke_open_epub = function() {
    type Payload = {
        chapters: string[], 
        paths: string[], 
        dir: string,
        base_path: string,
        container: string,
    }
    const ir = new InvokeRequest<Payload>('epub-opened', 'epub-open-error')

    return function(path: string) {
        return ir.invoke('open_epub', { path })
    }
}()

// 保存EPUB
const invoke_save_epub = function() {
    type Payload = undefined
    const ir = new InvokeRequest<Payload>('epub-saved', 'epub-save-error')

    return function(input_dir: string, output_dir: string) {
        return ir.invoke('save_epub', { saveOptions: { input_dir, output_dir } })
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
    const ir = new InvokeRequest<Payload>('write-success', 'write-error')

    return function(dir: string, path: string, content: string) {

        return ir.invoke('write_text', { textContents: { dir, path, content } })
    }
}()

// 清除EPUB缓存
const invoke_clean_cache = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('clean-success', 'clean-error')

    return function(dir: string) {
        return ir.invoke('clean_cache', { dir })
    }
}()

// 添加文件 （将文件复制到缓存路径）
const invoke_copy_file = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('file-copied', 'file-copy-error')

    return function(from: string, dir: string, id: string) {
        return ir.invoke('copy_file', { copyOption: { dir, from, to_id: id } })
    }
}()

// 删除文件
const invoke_remove_file = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('remove-success', 'remove-error')

    return function(dir: string, id: string) {

        return ir.invoke('remove_file', { removeOption: { path: dir, id } })
    }
}()

// 文件重命名
const invoke_rename_file = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('rename-success', 'rename-error')

    return function(dir: string, id: string, new_name: string) {

        return ir.invoke('rename_file', { renameOption: { path: dir, id, new_name } })
    }
}()

// 搜索
const invoke_search = function() {
    type Payload = Record<string, SearchResult[]>

    const ir = new InvokeRequest<Payload>('search', 'search-error')

    return function(dir: string, pattern: string, regex: boolean, case_sensitive: boolean) {

        return ir.invoke('find', { searchOption: { dir, pattern, regex, case_sensitive } })
    }
}()

// 替换
const invoke_replace = function() {
    type Payload = string
    const ir = new InvokeRequest<Payload>('replace', 'replace-error')

    return function(dir: string, pattern: string, regex: boolean, case_sensitive: boolean, replacement: string) {

        return ir.invoke('replace', { replaceOption: { dir, pattern, regex, case_sensitive, replacement } })
    }
}()

export {
    invoke_open_epub,
    invoke_save_epub,
    invoke_get_text,
    invoke_write_text,
    invoke_clean_cache, 
    invoke_copy_file,
    invoke_remove_file,
    invoke_rename_file,
    invoke_search,
    invoke_replace,
}
