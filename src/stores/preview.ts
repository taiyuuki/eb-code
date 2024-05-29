import { invoke_get_port } from '@/invoke'

const usePreview = defineStore('preview', {
    state: () => ({ 
        id: '',
        port: 0,
        need_reload: false,
    }),
    actions: {
        get_port() {
            invoke_get_port().then(port => {
                this.port = port
            })
        },
    },
})

export { usePreview }
