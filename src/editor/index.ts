import * as monaco from 'monaco-editor'
import { emmetHTML } from 'emmet-monaco-es'
import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import typescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import type { Language } from './shiki'

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
}

class MonacoController {
    static _instance: MonacoController
    static text_model: monaco.editor.ITextModel

    constructor() {
        if (new.target !== MonacoController) {
            return
        }
        if (!MonacoController._instance) {
            initMonaco()
            MonacoController.text_model = monaco.editor.createModel('', 'html')
            MonacoController._instance = this
        }

        return MonacoController._instance
    }

    create_monaco(el: HTMLElement) {
        monaco.editor.create(el, {
            model: MonacoController.text_model,
            automaticLayout: true,
            cursorSmoothCaretAnimation: 'on',
            scrollBeyondLastLine: false,
            bracketPairColorization: { enabled: true },
            cursorSurroundingLines: 5,
            fontLigatures: true,
        })

        return monaco
    }

    set_code(code: string) {
        MonacoController.text_model.setValue(code)
    }

    get_code() {
        return MonacoController.text_model.getValue()
    }

    set_lang(lang: Language) {
        monaco.editor.setModelLanguage(MonacoController.text_model, lang)
    }

    get_lang() {
        return MonacoController.text_model.getLanguageId() as Language
    }

    on_change_code(fn: (e: monaco.editor.IModelContentChangedEvent)=> void) {
        MonacoController.text_model.onDidChangeContent(e => {
            fn(e)
        })
    }

    on_change_lang(fn: (e: monaco.editor.IModelLanguageChangedEvent)=> void) {
        MonacoController.text_model.onDidChangeLanguage(e => {
            fn(e)
        })
    }

    on_change_decorations(fn: (e: monaco.editor.IModelDecorationsChangedEvent)=> void) {
        MonacoController.text_model.onDidChangeDecorations(e => {
            fn(e)
        })
    }
}

function create_controller() {

    return new MonacoController()
}

function get_code() {
    return MonacoController.text_model.getValue()
}

function get_scroll_top() {
    const editor = monaco.editor.getEditors()[0]

    return editor.getScrollTop() || 0
}

function scroll_top_to(top: number) {
    const editor = monaco.editor.getEditors()[0]
    editor.setScrollTop(top)
}

export {
    initMonaco,
    get_scroll_top,
    scroll_top_to,
    create_controller,
    get_code,
}
