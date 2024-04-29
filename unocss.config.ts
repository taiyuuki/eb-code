import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetUno,
} from 'unocss'
import { presetTaiyuuki }from '@taiyuuki/unocss-preset'

export default defineConfig({
    presets: [
        presetAttributify({}),
        presetUno(),
        presetIcons(),
        presetTaiyuuki(),
    ],
    shortcuts: [],
    variants: [],
})
