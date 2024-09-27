import { resolve } from 'node:path'
import type { RouteRecord } from 'vue-router'
import type { PluginEntry } from '@quasar/app-vite/types/configuration/build'

import nlsPlugin, { Languages } from './nls'
import zh_hans from './nls/zh-hans.json'

// import { rollup_plugin_sortablejs } from './sortablejs'

function is_dev() {
    return process.env.NODE_ENV === 'development'
}

const vite_plugins: PluginEntry[] = [
    ['vite-plugin-pages', {
        extensions: ['vue'],
        extendRoute(route: RouteRecord) {
            if (route.path === '/') {
                return route
            }

            return {
                ...route,
                meta: { auth: true },
            }
        },
    }],
    [
        'vite-plugin-vue-layouts',
        { defaultLayout: 'MainLayout' },
    ],
    [
        'unplugin-vue-components/vite',
        { dts: 'src/components.d.ts' },
    ],
    [
        'unplugin-auto-import/vite',
        {
            imports: [
                'vue',
                'pinia',
                'vue-router',
                {
                    'quasar': [
                        'useQuasar',
                        'Notify',
                        'Dialog',
                        'LocalStorage',
                        'useMeta',
                    ],
                    'axios': ['AxiosInstance', ['default', 'axios']],
                    'quasar/wrappers': ['boot'],
                },
            ],
            dts: 'src/auto-imports.d.ts',
        },
    ],
    ['unocss/vite', {/** unocss options */ }],
    ['unplugin-svg-component/vite', {
        iconDir: resolve(process.cwd(), 'src/svg'),
        dts: true,
        dtsDir: 'src',
        componentStyle: 'width:100%;height:100%;fill:currentColor;',
        scanStrategy: 'text',
    }],

    // rollup_plugin_sortablejs(),
]

is_dev() || vite_plugins.push(nlsPlugin({
    locale: Languages.zh_hans,
    localeData: zh_hans,
}))

export default vite_plugins
