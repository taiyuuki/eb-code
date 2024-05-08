import { invoke } from '@tauri-apps/api/core'

function invoke_open_epub(path: string) {
    invoke('open_epub', { path })
}

function invoke_save_epub(input_dir: string, output_dir: string) {
    invoke('save_epub', { saveOptions: { input_dir, output_dir } })
}

function invoke_get_text(path: string, dir: string) {
    invoke('get_text', { textDirectory: { dir, path } })
}

function invoke_write_text(dir: string, path: string, content: string) {
    invoke('write_text', { textContents: { dir, path, content } })
}

function invoke_clean_cache(dir: string) {
    invoke('clean_cache', { dir })
}

export {
    invoke_open_epub,
    invoke_save_epub,
    invoke_get_text,
    invoke_write_text,
    invoke_clean_cache,
}
