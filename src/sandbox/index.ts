import type { Key } from '@taiyuuki/utils/dist/types/types'

const sandbox_caches = new WeakMap()
function compile_plugin(sandbox: Record<Key, any>, plugin_code: string) {
    const code = `with (sandbox) {run(_book, _load);${plugin_code};}`
    const fn = new Function('sandbox', code)

    return function() {
        if (!sandbox_caches.has(sandbox)) {
            const sandbox_proxy = new Proxy(sandbox, { 
                has() {
                    return true
                },
                get(target, key) {
                    if (key === Symbol.unscopables) return undefined

                    return target[key]
                },
            })
            sandbox_caches.set(sandbox, sandbox_proxy)
        }

        return fn(sandbox_caches.get(sandbox))
    }
}

export { compile_plugin }
