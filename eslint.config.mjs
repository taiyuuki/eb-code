import tyk from '@taiyuuki/eslint-config'

export default tyk({
    vue: true,
    ts: true,
    ignores: [
        '**/dist',
        '**/src-capacitor',
        '**/src-cordova',
        '**/.quasar',
        '**/node_modules',
        '**.eslintrc.js',
        '**/src-ssr',
        '**/src-tauri',
        '**/public/ses',
    ],
}, {
    files: ['quasar.config.ts'],
    rules: { '@stylistic/object-curly-newline': 'off' },
}, { rules: { 'no-undef': 'off' } })
