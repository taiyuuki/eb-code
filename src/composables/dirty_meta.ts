import { useStatus } from '@/stores/status'
import stores from '@/stores'

const status = useStatus(stores)

export const dirty_meta = ref(toRaw(status.metadata))
