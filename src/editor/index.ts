import * as monaco from 'monaco-editor'
import { emmetCSS, emmetHTML } from 'emmet-monaco-es'
import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import typescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import type { Language } from './shiki'
import { useEPUB } from '@/stores/epub'
import { useCustomCSSProperties } from '@/stores/custom-properties'
import stores from '@/stores'
import { useOption } from '@/stores/option'

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
                case 'typescript':
                    return new typescriptWorker({ name: label })
                default:
                    return new editorWorker({ name: label })
            }
        },
    }
    
    emmetHTML(monaco)
    emmetCSS(monaco)
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
        const option = useOption(stores)
        const editor = monaco.editor.create(el, {
            model: MonacoController.text_model,
            automaticLayout: true,
            cursorSmoothCaretAnimation: option.value.cursor_animation ? 'on' : 'off',
            scrollBeyondLastLine: false,
            bracketPairColorization: { enabled: true },
            cursorSurroundingLines: 5,
            fontLigatures: true,
            fontSize: option.value.font_size,
            tabSize: option.value.indent,
            minimap: { enabled: option.value.minimap },
            smoothScrolling: option.value.smooth_scrolling,
            lineNumbers: option.value.line_numbers ? 'on' : 'off',
            wordWrap: option.value.wordWrap ? 'on' : 'off',
            linkedEditing: true,
            unicodeHighlight: {
                ambiguousCharacters: false,
                invisibleCharacters: false,
            },
        })
        register_openner(editor)

        monaco.editor.onDidChangeMarkers(e => {
            const markers = monaco.editor.getModelMarkers({ owner: 'css', resource: e[0] })
            const customCSS = useCustomCSSProperties()
            if (markers.length) {
                monaco.editor.setModelMarkers(MonacoController.text_model, 'css', markers.filter(m => !customCSS.properties.some(ignore => m.message.includes(ignore))))
            }
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
    const editor = monaco.editor.getEditors()[0]

    return editor.getModel()?.getValue()
}

function get_scroll_top() {
    const editor = monaco.editor.getEditors()[0]

    return editor.getScrollTop() || 0
}

function scroll_top_to(top: number) {
    const editor = monaco.editor.getEditors()[0]
    editor.setScrollTop(top)
}

function scroll_to_line(lnum: number) {
    const editor = monaco.editor.getEditors()[0]

    editor.revealLineNearTop(lnum)

    setTimeout(() => {
        editor.setPosition({
            lineNumber: lnum,
            column: 1,
        })
    })
}

function set_font_size(size: number) {
    const editor = monaco.editor.getEditors()[0]
    editor.updateOptions({ fontSize: size })
}

function set_indent(size: number) {
    const editor = monaco.editor.getEditors()[0]
    editor.getModel()?.updateOptions({ tabSize: size, indentSize: size })
}

function update_option(option: monaco.editor.IStandaloneEditorConstructionOptions) {
    const editor = monaco.editor.getEditors()[0]
    editor.updateOptions(option)
}

function register_openner(editor: monaco.editor.IStandaloneCodeEditor) {

    // @ts-expect-error - 非标准行为，拦截打开链接
    editor.getContribution('editor.linkDetector').openerService._openers._first.element.open = function(url: string) {
        if (url.startsWith('file')) {
            url = url.substring(7)
        }
        const epub = useEPUB(stores)
        epub.follow_link(url)
    }
}

export {
    initMonaco,
    get_scroll_top,
    scroll_top_to,
    scroll_to_line,
    create_controller,
    get_code,
    set_font_size,
    set_indent,
    update_option,
}
