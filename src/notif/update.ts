import { ask, message } from '@tauri-apps/plugin-dialog'
import { check } from '@tauri-apps/plugin-updater'

async function check_update(confirm = true) {
    const update = await check().catch(() => {
        message('检查更新失败，请检查网络！')

        return null
    })
    if (update) {
        const [major, minor, patch] = (<string>update.version).split('.').map(n => Number(n))
        const [cur_major, cur_minor, cur_patch] = (<string>update.currentVersion).split('.').map(n => Number(n))
        if (cur_major < major 
            || cur_major === major && cur_minor < minor 
            || cur_major === major && cur_minor === minor && cur_patch < patch) {
            const yes = await ask(`发现新版本${update.version}，是否前往下载？`, {
                title: '检查更新',
                okLabel: '更新',
                cancelLabel: '取消',
            })
            if (yes) {
                window.open('https://github.com/taiyuuki/eb-code/releases/latest')
            }
        }
        else if (confirm) {
            message('已经是最新版本！')
        }
    }
    else if (confirm) {
        message('已经是最新版本！')
    }
}

export { check_update }
