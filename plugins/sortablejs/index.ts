import type { Plugin as EsbuildPlugin } from 'esbuild'
import type { Plugin as RollupPlugin } from 'rollup'

function inject_multi(s: string) {
    return s.replace('Sortable.mount(new AutoScrollPlugin());', `
    Sortable.mount(new AutoScrollPlugin());
    Sortable.mount(new MultiDragPlugin());
    `)
}

export function esbuild_plugin_sortablejs(): EsbuildPlugin {
    return {
        name: 'esbuild-plugin-sortablejs',
        setup(build) {
            
            let s = ''
            build.onResolve({ filter: /vuedraggable/, namespace: 'sortablejs' }, async args => {
                s = inject_multi(args.resolveDir)

                return {
                    path: args.path,
                    namespace: 'sortablejs',
                }
            })

            build.onLoad({ filter: /.*/, namespace: 'sortablejs' }, async() => {
                return {
                    contents: s,
                    loader: 'js',
                }
            })
        },
    }
}

export function rollup_plugin_sortablejs(): RollupPlugin {
    return {
        name: 'rollup-plugin-sortablejs',
        transform(code, path) {
            if (/vuedraggable/.test(path)) {

                return { code: inject_multi(code) }
            }
        },
    }
}
