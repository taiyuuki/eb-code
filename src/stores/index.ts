import { createPinia } from 'pinia'
import type { Router } from 'vue-router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
    export interface PiniaCustomProperties {
        readonly router: Router;
    }
}

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

export default pinia
