import stores from '@/stores'
import { usePreview } from '@/stores/preview'

const preview = usePreview(stores)

preview.get_port()
