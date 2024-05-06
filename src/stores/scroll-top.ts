const useScrollTop = defineStore('scroll_top', {
    state: () => ({ tops: {} as Record<string, number> }),
    actions: {
        add(id: string, top: number) {
            this.tops[id] = top
        },
        remove(id: string) {
            delete this.tops[id]
        },
        has(id: string) {
            return id in this.tops
        },
        get(id: string) {
            return this.has(id) ? this.tops[id] : 1
        },
    },
})

export { useScrollTop }
