import * as monaco from 'monaco-editor-core'
import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import typescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

function initMonaco() {

    // @ts-expect-error This script is for monaco worker
    self.MonacoEnvironment = {
        async getWorker(_: any, label: string) {
            switch (label) {
                case 'javascript':
                    return new typescriptWorker()
                case 'json':
                    return new jsonWorker()

                case 'css':
                    return new cssWorker()

                case 'html':
                case 'xhtml':
                case 'xml':
                    return new htmlWorker()

                default:
                    return new editorWorker()
            }
        },
    }

    monaco.languages.register({ id: 'javascript', extensions: ['.js'], aliases: ['js', 'JS'] })
    monaco.languages.register({ id: 'json', extensions: ['.json'], aliases: ['json', 'JSON'] })
    monaco.languages.register({ id: 'html', extensions: ['.html'], aliases: ['html', 'HTML'] })
}

export { initMonaco }
