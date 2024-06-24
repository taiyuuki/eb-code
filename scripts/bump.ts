import { readFileSync, writeFileSync } from 'node:fs'

function bump(type: 'major' | 'minor' | 'patch') {
    const pkg = readFileSync('./package.json', 'utf-8')
    const cargo = readFileSync('./src-tauri/Cargo.toml', 'utf-8')
    const tauriConf = readFileSync('./src-tauri/tauri.conf.json', 'utf-8')

    const { version } = JSON.parse(pkg)

    const [major, minor, patch] = (<string>version).split('.').map(n => Number(n))
    const newVersion = type === 'major' ? `${major + 1}.0.0` : type === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`
    
    const newPkg = pkg.replace(/"version"\s*:\s*".*"/, `"version": "${newVersion}"`)
    const newCargo = cargo.replace(/\nversion = ".*"\n/, `\nversion = "${newVersion}"\n`)
    const newTauriConf = tauriConf.replace(/"version"\s*:\s*".*"/, `"version": "${newVersion}"`)

    writeFileSync('./package.json', newPkg)
    writeFileSync('./src-tauri/Cargo.toml', newCargo)
    writeFileSync('./src-tauri/tauri.conf.json', newTauriConf)
}

const type = process.argv[2] as 'major' | 'minor' | 'patch'
bump(type)
