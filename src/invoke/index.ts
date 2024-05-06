import { invoke } from '@tauri-apps/api/core'

function invoke_open_epub(path: string) {
    invoke('open_epub', { path })
}

function invoke_get_text(path: string) {
    invoke('get_text', { path })
}

export {
    invoke_open_epub,
    invoke_get_text,
}
