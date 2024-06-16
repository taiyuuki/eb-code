const useFontSize = defineStore('font-size', {
    state: () => {
        return { size: 18 }
    },
    actions: {
        set_size(size: number) {
            this.size = size
        },
    },
    persist: true,
})

export { useFontSize }
