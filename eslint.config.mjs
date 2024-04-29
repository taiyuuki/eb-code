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
    ],
    rules: {
        'vue/multi-word-component-names': ['error', {
            ignores: [
                'index',
                'default',
                '404',
                'Home',
                'About',
                'Main',
            ],
        }],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
}, {
    files: ['quasar.config.ts'],
    rules: { '@stylistic/object-curly-newline': 'off' },
})
