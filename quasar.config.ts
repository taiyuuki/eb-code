/* eslint-env node */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { join } from 'node:path'
import type { UserConfig } from 'vite'
import { configure } from 'quasar/wrappers'
import { internalIpV4 } from 'internal-ip'
import { Languages, esbuildPluginMonacoEditorNls } from './plugins/nls'
import zh_hans from './plugins/nls/zh-hans.json'
import vite_plugins from './plugins'

interface ViteConf extends UserConfig {
    minify: boolean | 'esbuild'
    sourcemap: boolean
}

function resolve(dir: string) {
    return join(__dirname, dir)
}

// const isPro = process.env.NODE_ENV === 'production'
const mobile = process.env.TAURI_ENV_PLATFORM && !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM)

export default configure((/* ctx */) => {
    return {

        // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
        // preFetch: true,

        // app boot file (/src/boot)
        // --> boot files are part of "main.js"
        // https://v2.quasar.dev/quasar-cli-vite/boot-files
        boot: [
            'unocss',
            'port',
        ],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
        css: [
            'app.scss',
        ],

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: [

            // 'ionicons-v4',
            // 'mdi-v7',
            // 'fontawesome-v6',
            // 'eva-icons',
            // 'themify',
            // 'line-awesome',
            // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

            'roboto-font', // optional, you are not bound to it
            'material-icons', // optional, you are not bound to it
        ],

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
        build: {
            alias: {
                '@': resolve('src'),
                'src': resolve('src'),
                'components': resolve('src/components'),
                'composables': resolve('src/composables'),
                'boot': resolve('src/boot'),
                'layouts': resolve('src/layouts'),
                'pages': resolve('src/pages'),
                'router': resolve('src/router'),
                'stores': resolve('src/stores'),
                'assets': resolve('src/assets'),
            },
            target: {
                browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
                node: 'node20',
            },

            vueRouterMode: 'hash', // available values: 'hash', 'history'
            // vueRouterBase,
            // vueDevtools,
            // vueOptionsAPI: false,

            // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

            // publicPath: '/',
            // analyze: true,
            // env: {},
            // rawDefine: {}
            // ignorePublicFolder: true,
            // minify: false,
            // polyfillModulePreload: true,
            // distDir

            async extendViteConf(viteConf: UserConfig) {
                viteConf.clearScreen = false

                // viteConf.server = {
                //     strictPort: true,
                // }
                viteConf.envPrefix = ['VITE_', 'TAURI_']
                if (!viteConf.build) {
                    viteConf.build = {}
                }

                viteConf.build.target = process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13';
                (<ViteConf>viteConf).minify = process.env.TAURI_DEBUG ? false : 'esbuild';
                (<ViteConf>viteConf).sourcemap = !!process.env.TAURI_DEBUG

                viteConf.server = {
                    port: 1420,
                    strictPort: true,
                    host: mobile ? '0.0.0.0' : false,
                    open: false,
                    hmr: mobile
                        ? {
                            protocol: 'ws',
                            host: await internalIpV4(),
                            port: 1421,
                            overlay: false,
                        }
                        : {
                            overlay: false,
                        },
                    watch: {

                        // 3. tell vite to ignore watching `src-tauri`
                        ignored: ['**/src-tauri/**'],
                    },
                },

                viteConf.build.rollupOptions = {
                    output: {
                        chunkFileNames: 'js/[name]-[hash].js',
                        entryFileNames: 'js/[name]-[hash].js',
                        assetFileNames: '[ext]/[name]-[hash].[ext]',
                    },
                }

                viteConf.optimizeDeps = {
                    esbuildOptions: {
                        plugins: [
                            esbuildPluginMonacoEditorNls({
                                locale: Languages.zh_hans,
                                localeData: zh_hans.contents,
                            }),
                        ],
                    },
                }
            },

            // viteVuePluginOptions: {},
      
            vitePlugins: vite_plugins,
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
        devServer: {

            // https: true
            open: false, // opens browser window automatically
            port: mobile ? 1421 : 1420,
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
        framework: {
            config: {},

            // iconSet: 'material-icons', // Quasar icon set
            // lang: 'en-US', // Quasar language pack

            // For special cases outside of where the auto-import strategy can have an impact
            // (like functional components as one of the examples),
            // you can manually specify Quasar components/directives to be available everywhere:
            //
            // components: [],
            // directives: [],

            // Quasar plugins
            plugins: ['Notify', 'Dialog'],
        },

        // animations: 'all', // --- includes all animations
        // https://v2.quasar.dev/options/animations
        animations: [],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
        // sourceFiles: {
        //   rootComponent: 'src/App.vue',
        //   router: 'src/router/index',
        //   store: 'src/store/index',
        //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
        //   pwaServiceWorker: 'src-pwa/custom-service-worker',
        //   pwaManifestFile: 'src-pwa/manifest.json',
        //   electronMain: 'src-electron/electron-main',
        //   electronPreload: 'src-electron/electron-preload'
        //   bexManifestFile: 'src-bex/manifest.json
        // },

        // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
        ssr: {
            prodPort: 3000, // The default port that the production server should use
            // (gets superseded if process.env.PORT is specified at runtime)

            middlewares: [
                'render', // keep this as last one
            ],

            // extendPackageJson (json) {},
            // extendSSRWebserverConf (esbuildConf) {},

            // manualStoreSerialization: true,
            // manualStoreSsrContextInjection: true,
            // manualStoreHydration: true,
            // manualPostHydrationTrigger: true,

            pwa: false,

            // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!
            // will mess up SSR

            // pwaExtendGenerateSWOptions (cfg) {},
            // pwaExtendInjectManifestOptions (cfg) {}
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
        pwa: {
            workboxMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
            // swFilename: 'sw.js',
            // manifestFilename: 'manifest.json'
            // extendManifestJson (json) {},
            // useCredentialsForManifestTag: true,
            // injectPwaMetaTags: false,
            // extendPWACustomSWConf (esbuildConf) {},
            // extendGenerateSWOptions (cfg) {},
            // extendInjectManifestOptions (cfg) {}
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
        cordova: {

            // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
        capacitor: {
            hideSplashscreen: true,
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
        electron: {

            // extendElectronMainConf (esbuildConf) {},
            // extendElectronPreloadConf (esbuildConf) {},

            // extendPackageJson (json) {},

            // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
            preloadScripts: ['electron-preload'],

            // specify the debugging port to use for the Electron app when running in development mode
            inspectPort: 5858,

            bundler: 'packager', // 'packager' or 'builder'

            packager: {

                // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

                // OS X / Mac App Store
                // appBundleId: '',
                // appCategoryType: '',
                // osxSign: '',
                // protocol: 'myapp://path',

                // Windows only
                // win32metadata: { ... }
            },

            builder: {

                // https://www.electron.build/configuration/configuration

                appId: 'eb-code',
            },
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
        bex: {

            // extendBexScriptsConf (esbuildConf) {},
            // extendBexManifestJson (json) {},

            contentScripts: [
                'my-content-script',
            ],
        },
    }
})
