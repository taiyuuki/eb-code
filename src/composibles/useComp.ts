import type { Ref } from 'vue'

function useCompRef<T>(_: T) {
    return ref() as Ref<typeof _>
}

function useElementRef<T extends HTMLElement>() {
    return ref() as Ref<T>
}

export { useCompRef, useElementRef }
