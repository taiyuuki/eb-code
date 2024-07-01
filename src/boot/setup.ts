import { invoke_clean_cache, invoke_setup } from '@/invoke'
import { notif_negative } from '@/notif'
import stores from '@/stores'
import { usePreview } from '@/stores/preview'
import { useEPUB } from '@/stores/epub'
import { basename } from '@/utils/path'

const preview = usePreview(stores)
const epub = useEPUB(stores)

const observer = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
        const navi_type = Reflect.get(entry, 'type')
        preview.get_port().then(() => {
            if (navi_type === 'navigate') {
                invoke_setup().then(payload => {
                    epub.save_path = payload.save_path
                    epub.set_dir(payload.dir)
                    epub.set_base_path(payload.base_path)
                    epub.parse(payload)
                }, e => {
                    if (e !== '0') {
                        notif_negative(`${basename(e)}不是有效的EPUB文件。`)
                    }
                }) 
            }
            else if (epub.dir && navi_type === 'reload') {
                invoke_clean_cache(epub.dir)
            }
        })
    })
})

observer.observe({ type: 'navigation', buffered: true })
