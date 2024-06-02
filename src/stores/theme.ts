import { dom_set_css_var } from '@taiyuuki/utils'
import type { ShikiTheme } from '@/editor/themes'

const useTheme = defineStore('theme', {
    state: () => ({
        dark: false,
        background: '#24292e', 
        color: '#e1e4e8',
        shiki: 'night-owl' as ShikiTheme,
    }),

    actions: {
        set_colors() {

            dom_set_css_var('eb-fg', this.color)
            dom_set_css_var('eb-bg', this.background)
        },
        set_theme(theme: ShikiTheme) {
            this.shiki = theme
        },
    },

    persist: true,
})

export { useTheme }
