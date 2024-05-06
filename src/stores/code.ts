import type { Language } from '@/editor/shiki'

const useCode = defineStore('code', {
    state: () => ({
        value: '',
        lang: 'html' as Language,
    }),
})

export { useCode }
