import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function current_key() {
    const tauriConf = readFileSync('./src-tauri/tauri.conf.json', 'utf-8')
    const pubKey = readFileSync(resolve(process.cwd(), '~/.tauri/myapp.key.pub'), 'utf-8')

    const config = JSON.parse(tauriConf)
    config.plugins.updater.pubkey = pubKey
    
    writeFileSync('./src-tauri/tauri.conf.json', JSON.stringify(config, null, 2))
}

current_key()
