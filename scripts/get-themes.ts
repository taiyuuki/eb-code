import { basename } from 'node:path'
import { writeFileSync } from 'node:fs'
import fg from 'fast-glob'

function get_all_themes() {
    const themes = fg.sync('./node_modules/shiki/dist/themes/*.mjs').map(path => basename(path, '.mjs'))

    writeFileSync('./src/editor/themes.ts', `
    // This file is generated by 'scripts/get-themes.ts'
    const themes = ${JSON.stringify(themes, null, 4)} as const

    export type ShikiTheme = typeof themes[number]
    export { themes }
    `.trim())
}

get_all_themes()
