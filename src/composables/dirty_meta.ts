import { useEPUB } from '@/stores/epub'
import stores from '@/stores'

const epub = useEPUB(stores)

export const dirty_meta = ref(toRaw(epub.metadata))
