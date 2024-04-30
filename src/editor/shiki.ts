import { getHighlighterCore } from 'shiki/core'
import { object_keys } from '@taiyuuki/utils'
import getWasmInlined from 'shiki/wasm'
import type { Theme } from './themes'

type Language = 'css' | 'html' | 'javascript' | 'json' 

const themes_imorts = import.meta.glob('../../node_modules/shiki/dist/themes/*.mjs', { import: 'default' })
const themes = object_keys(themes_imorts).reduce((acc, path) => {
    acc[path.replace('../../node_modules/shiki/dist/themes/', '').replace('.mjs', '')] = themes_imorts[path]

    return acc
}, {} as Record<string, any>)

const langs_imports = import.meta.glob('../../node_modules/shiki/dist/langs/{css,javascript,json,html,xml}.mjs', { import: 'default' })
const langs = object_keys(langs_imports).reduce((acc, path) => {
    acc[path.replace('../../node_modules/shiki/dist/langs/', '').replace('.mjs', '')] = langs_imports[path]

    return acc
}, {} as Record<string, any>)

async function getTheme(theme_name: Theme, language: Language) {
    const shiki = await themes[theme_name]()
    const lang = await langs[language]()

    return {
        type: shiki.type,
        hightlighter: await getHighlighterCore({ langs: [lang], themes: [shiki], loadWasm: getWasmInlined }),
    }
}

export { getTheme }
