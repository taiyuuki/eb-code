import { arr_move, arr_remove } from '@taiyuuki/utils'

const useRecent = defineStore('recent', {
    state: () => ({ list: [] as string[] }),
    actions: {
        add(path: string) {
            const i = this.list.indexOf(path)
            if (i > 0) {
                arr_move(this.list, i, 0)
            }
            else if (i !== 0) {
                this.list.unshift(path)
                if (this.list.length > 6) {
                    this.list.pop()
                }
            }
        },
        remove(path: string) {
            arr_remove(this.list, path)
        },
        clean() {
            this.list.length = 0
        },
    },
    persist: true,
})

export { useRecent }
