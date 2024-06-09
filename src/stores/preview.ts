import { invoke_get_port } from '@/invoke'

const usePreview = defineStore('preview', {
    state: () => ({ 
        id: '',
        port: 0,
        need_reload: false,
        display: false,
        base_width: 300,
        latest_width: 300,
        width: 0,
    }),
    actions: {
        get_port() {
            invoke_get_port().then(port => {
                this.port = port
            })
        },
        clean() {
            this.id = ''
            this.need_reload = false
        },
        reload_iframe() {
            if(this.display) {
                this.need_reload = true
            }
        },
        close() {
            this.display = false
            if (this.width === 0) {
                this.latest_width = this.base_width
            } else {
                this.latest_width = this.width
                this.width = 0
            }
        },
        open() {
            this.display = true
            if (this.latest_width === 0) {
                this.latest_width = this.base_width
            } else {
                this.width = this.latest_width
            }
        },
        toggle() {
            if (this.display) {
                this.close()
            } else {
                this.open()
            }
        },
    },
})

export { usePreview }
