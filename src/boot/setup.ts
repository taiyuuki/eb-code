import { invoke_setup } from '@/invoke'
import { notif_negative } from '@/notif'
import stores from '@/stores'
import { usePreview } from '@/stores/preview'
import { useStatus } from '@/stores/status'
import { basename } from '@/utils/path'

const preview = usePreview(stores)
const status = useStatus(stores)

const observer = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
        const navi_type = Reflect.get(entry, 'type')
        preview.get_port().then(() => {
            if (navi_type === 'navigate') {
                invoke_setup().then(payload => {
                    status.current.save_path = payload.save_path
                    status.set_dir(payload.dir)
                    status.set_base_path(payload.base_path)
                    status.parse_epub(payload)
                }, e => {
                    if (e !== '0') {
                        notif_negative(`${basename(e)}不是有效的EPUB文件。`)
                    }
                }) 
            } 
        })
    })
})

observer.observe({ type: 'navigation', buffered: true })
