import * as monaco from 'monaco-editor'
import { emmetHTML } from 'emmet-monaco-es'
import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import typescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

function initMonaco() {
    
    self.MonacoEnvironment = {
        getWorker: function(_workerId: string, label: string) {

            switch (label) {
                case 'json':
                    return new jsonWorker({ name: label })
                case 'css':
                    return new cssWorker({ name: label })
                case 'html':
                case 'xhtml':
                case 'xml':
                    return new htmlWorker({ name: label })
                case 'javascript':
                    return new typescriptWorker({ name: label })
                default:
                    return new editorWorker({ name: label })
            }
        },
    }
    emmetHTML(monaco)

    return monaco
}

export { initMonaco }
