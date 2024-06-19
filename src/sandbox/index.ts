import { load } from 'cheerio'
import { useStatus } from '@/stores/status'
import stores from '@/stores'
import { invoke_get_text, invoke_write_text } from '@/invoke'
import 'ses'

const status = useStatus(stores)

const sandbox = {
    _api: {
        _book: {
            get_bookid() {
                return status.book_id
            },
            get_spine() {
                return status.get_spine()
            },
            set_spine(manifest_id: string, linear: boolean) {
                status.add_spine(manifest_id, linear)
            },
            spine_insert_before(position: number, manifest_id: string, linear: boolean, properties?: Record<string, string>) {
                status.spine_insert_before(position, manifest_id, linear, properties)
            },
            async readfile(manifest_id: string) {
                const id = status.get_id(manifest_id)
                if (id) {
                    const result = await invoke_get_text(id, status.dir)
    
                    return result[0]
                }
                else {
                    return null
                }
            },
            async writefile(manifest_id: string, data: string) {
                const id = status.get_id(manifest_id)
                if (id) {
                    return invoke_write_text(id, status.dir, data)
                }
            },
            get_spine_ppd() {
                return status.get_spine_ppd()
            },
            get_metadata_xml() {
                return status.get_metadata_xml()
            },
            get_package_tag() {
                return status.get_package_tag()
            },
            set_package_tag(tag: Record<string, string>) {
                status.set_package_tag(tag)
            },
        },
        async _save_opf() {
            if (status.opf_is_dirty) {
                await status.save_opf()
            }
        },
        _load: load,
    },
    console,
    Array,
    Date,
    JSON,
    Math,
    Object,
    String,
    Promise,
    Map,
    Set,
    WeakMap,
    WeakSet,
}

function create_plugin(plugin_code: string) {
    const code = `
    (function () {
        ${plugin_code}
        async function run_plugin() {
            await run(_api._book, _api._load);
            await _api._save_opf();
        };
        run_plugin();
    })
    `

    return new Compartment(sandbox).evaluate(code)
}

export { create_plugin }
