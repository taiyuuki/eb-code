import { invoke } from '@tauri-apps/api/core'
import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import type { Language } from '@/editor/shiki'

const invoke_open_epub = function() {
    type Payload = { 
        chapters: string[], 
        pathes: string[], 
        dir: string,
        base_path: string,
        container: string,
    }
    let rs: (value: Payload | PromiseLike<Payload>)=> void
    let rj: (reason?: any)=> void
    let is_listening = false

    return function(path: string) {
        if (!is_listening) {
            listen('epub-opened', (event: Event<Payload>) => {
                rs(event.payload)
            })
            listen('epub-open-error', (event: Event<string>) => {
                rj(event.payload)
            })
            is_listening = true
        }

        return new Promise<Payload>((resolve, reject) => {
            rs = resolve
            rj = reject
            invoke('open_epub', { path })
        })
    }
}()

const invoke_save_epub = function() {
    type Payload = undefined
    let rs: (value: Payload | PromiseLike<Payload>)=> void
    let rj: (reason?: any)=> void
    let is_listening = false

    return function(input_dir: string, output_dir: string) {
        if (!is_listening) {
            listen('epub-saved', (event: Event<Payload>) => {
                rs(event.payload)
            })
            listen('epub-save-error', (event: Event<string>) => {
                rj(event.payload)
            })
            is_listening = true
        }
        
        return new Promise<Payload>((resolve, reject) => {
            rs = resolve
            rj = reject
            invoke('save_epub', { saveOptions: { input_dir, output_dir } })
        })
    }
}()

const invoke_get_text = function() {
    type Payload = [string, Language, string]
    let rs: (value: Payload | PromiseLike<Payload>)=> void
    let rj: (reason?: any)=> void
    let is_listening = false

    return function(path: string, dir: string) {
        if (!is_listening) {
            listen('get-text', (event: Event<Payload>) => {
                rs(event.payload)
            })
            listen('get-text-error', (event: Event<string>) => {
                rj(event.payload)
            })
            is_listening = true
        }
        
        return new Promise<Payload>((resolve, reject) => {
            rs = resolve
            rj = reject
            invoke('get_text', { textDirectory: { dir, path } })
        })
    }
}()

const invoke_write_text = function() {
    type Payload = string
    let rs: (value: Payload | PromiseLike<Payload>)=> void
    let rj: (reason?: any)=> void
    let is_listening = false

    return function(dir: string, path: string, content: string) {
        if (!is_listening) {
            listen('text-saved', (event: Event<Payload>) => {
                rs(event.payload)
            })
            listen('text-save-error', (event: Event<string>) => {
                rj(event.payload)
            })
            is_listening = true
        }

        return new Promise<Payload>((resolve, reject) => {
            rs = resolve
            rj = reject
            invoke('write_text', { textContents: { dir, path, content } })
        })
    }
}()

const invoke_clean_cache = function() {
    type Payload = string
    let rs: (value: Payload | PromiseLike<Payload>)=> void
    let rj: (reason?: any)=> void
    let is_listening = false

    return function(dir: string) {
        if (!is_listening) {
            listen('clean-success', (event: Event<Payload>) => {
                rs(event.payload)
            })
            listen('clean-error', (event: Event<string>) => {
                rj(event.payload)
            })
            is_listening = true
        }

        return new Promise<Payload>((resolve, reject) => {
            rs = resolve
            rj = reject
            invoke('clean_cache', { dir })
        })
    }
}()

export {
    invoke_open_epub,
    invoke_save_epub,
    invoke_get_text,
    invoke_write_text,
    invoke_clean_cache,
}
