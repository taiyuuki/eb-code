import { route } from 'quasar/wrappers'
import {
    createMemoryHistory,
    createRouter,
    createWebHashHistory,
    createWebHistory,
} from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from 'virtual:generated-pages'

const routes = setupLayouts(generatedRoutes)
routes.push({
    path: '/:catchAll(.*)*',
    redirect: '/',
})

export default route(function(/* { store, ssrContext } */) {
    const routerMode = process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory
    const createHistory = process.env.SERVER
        ? createMemoryHistory
        : routerMode

    return createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,
        history: createHistory(process.env.VUE_ROUTER_BASE),
    })
})
