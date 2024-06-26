import type { LanguageRegistration, ThemeRegistrationRaw } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import getWasmInlined from 'shiki/wasm'
import { NOT_SUPPORTED_THEMES } from '@/static'

export type Language = 'css' | 'html' | 'javascript' | 'json' | 'xhtml' 

const themes_imorts = import.meta.glob<ThemeRegistrationRaw>('../../node_modules/shiki/dist/themes/*.mjs', { import: 'default' })
const langs_imports = import.meta.glob<LanguageRegistration>('../../node_modules/shiki/dist/langs/{css,javascript,json,html,xml}.mjs', { import: 'default' })

async function getLighter() {
    const langs = await Promise.all(Object.values(langs_imports).map(t => t()))
    const themes = await Promise.all(Object.values(themes_imorts).map(t => t()))

    const hightlighter = await createHighlighterCore({
        langs,
        themes: themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t.name!)),
        loadWasm: getWasmInlined, 
    })

    return hightlighter
}

export { getLighter }
