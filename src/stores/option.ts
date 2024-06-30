import { set_indent, update_option } from '@/editor'

const useOption = defineStore('option', {
    state: () => ({ 
        value: {
            indent: 4,
            font_size: 18,
            minimap: true,
            wordWrap: false,
            cursor_animation: true,
            smooth_scrolling: false,
            line_numbers: true,
        },
    }),
    actions: {
        save() {
            update_option({
                wordWrap: this.value.wordWrap ? 'on' : 'off',
                minimap: { enabled: this.value.minimap },
                fontSize: this.value.font_size,
                cursorSmoothCaretAnimation: this.value.cursor_animation ? 'on' : 'off',
                smoothScrolling: this.value.smooth_scrolling,
                lineNumbers: this.value.line_numbers ? 'on' : 'off',
            })
            set_indent(this.value.indent)
        },  
    },
    persist: true,
})

export { useOption }
