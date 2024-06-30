import beautify from 'js-beautify'
import { useOption } from '@/stores/option'
import stores from '@/stores'

function fmt_html(html: string) {
    const option = useOption(stores)

    return beautify.html(html, { indent_size: option.value.indent })
}

function fmt_css(css: string) {
    const option = useOption(stores)

    return beautify.css(css, { indent_size: option.value.indent })
}

export {
    fmt_html,
    fmt_css, 
}
