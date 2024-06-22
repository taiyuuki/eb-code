import { ask, message } from '@tauri-apps/plugin-dialog'
import { check } from '@tauri-apps/plugin-updater'

async function check_update() {
    const update = await check().catch(() => {
        message('检查更新失败，请检查网络！')

        return null
    })
    if (update) {
        if (update.currentVersion !== update.version) {
            const conf = await ask(`发现新版本${update.version}，是否前往下载？`, {
                title: '检查更新',
                okLabel: '更新',
                cancelLabel: '取消',
            })
            if (conf) {
                window.open('https://github.com/taiyuuki/eb-code/releases/latest')
            }

        }
    }
    else {
        message('已经是最新版本！')
    }
}

export { check_update }
