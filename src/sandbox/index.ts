import { load } from 'cheerio'
import { useEPUB } from '@/stores/epub'
import stores from '@/stores'
import { invoke_get_text, invoke_write_text } from '@/invoke'
import 'ses'

const epub = useEPUB(stores)

const sandbox = {
    _api: {
        _book: {
            get_bookid() {
                return epub.book_id
            },
            get_spine() {
                return epub.get_spine()
            },
            set_spine(manifest_id: string, linear: boolean) {
                epub.add_spine(manifest_id, linear)
            },
            spine_insert_before(position: number, manifest_id: string, linear: boolean, properties?: Record<string, string>) {
                epub.spine_insert_before(position, manifest_id, linear, properties)
            },
            async readfile(manifest_id: string) {
                const id = epub.get_id(manifest_id)
                if (id) {
                    const result = await invoke_get_text(id, epub.dir)
    
                    return result[0]
                }
                else {
                    return null
                }
            },
            async writefile(manifest_id: string, data: string) {
                const id = epub.get_id(manifest_id)
                if (id) {
                    return invoke_write_text(id, epub.dir, data)
                }
            },
            get_spine_ppd() {
                return epub.get_spine_ppd()
            },
            get_metadata_xml() {
                return epub.get_metadata_xml()
            },
            get_package_tag() {
                return epub.get_package_tag()
            },
            set_package_tag(tag: Record<string, string>) {
                epub.set_package_tag(tag)
            },
        },
        async _save_opf() {
            if (epub.opf_is_dirty) {
                await epub.save_opf()
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
    Blob,
    File,
    FileReader,
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
