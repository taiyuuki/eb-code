import { readFile, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import package_json from '../package.json'

function build() {
    const cwd = process.cwd()
    readFile(resolve(cwd, '~/.tauri/myapp.key'), 'utf-8', (e, key) => {
        if (e) {
            throw new Error('No private key found, private key is used to sign updates, see https://v2.tauri.app/plugin/updater')
        }
        
        const build_process = spawn('pnpm tauri build', [], {
            cwd,
            env: { 
                TAURI_SIGNING_PRIVATE_KEY: key,
                ...process.env,
            },
            shell: true,
            stdio: 'inherit',
        })
        build_process.on('exit', code => {
            gen_static_json()
            if (code !== 0) {
                throw new Error(`Build failed with code ${code}`)
            }
        })
    })
}

function gen_static_json() {
    const cwd = process.cwd()
    const sig_path = resolve(cwd, `src-tauri/target/release/bundle/nsis/Ebook Code_${package_json.version}_x64-setup.exe.sig`)
    const sig = readFileSync(sig_path, 'utf-8')
    const static_json = JSON.stringify({
        version: package_json.version,
        note: 'EPUB editor',
        pub_date: new Date().toISOString(),
        platform: {
            'windows-x86_64': {
                signature: sig,
                url: `https://github.com/taiyuuki/eb-code/releases/download/latest/Ebook Code_${package_json.version}-setup.exe`,
            }, 
            'macos-x86_64': {
                signature: sig,
                url: `https://github.com/taiyuuki/eb-code/releases/download/latest/Ebook Code_${package_json.version}-setup.dmg`,
            },
        },
    }, null, 4)
    writeFileSync(resolve(cwd, 'latest.json'), static_json)
}

build()
