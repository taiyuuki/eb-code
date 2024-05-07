import type { Ref } from 'vue'

function useCompRef<T>(_: T) {
    return ref() as Ref<T>
}

function useElementRef<T extends HTMLElement>() {
    return ref() as Ref<T>
}

export { useCompRef, useElementRef }
