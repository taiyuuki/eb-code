const useCustomCSSProperties = defineStore('custom', {
    state: () => ({
        properties: [
            'duokan-text-indent',
            'duokan-bleed',
        ] as string[], 
    }),
    persist: true,
})

export { useCustomCSSProperties }
