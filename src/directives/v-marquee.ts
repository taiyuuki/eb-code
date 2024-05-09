import type { Directive } from 'vue'

export const vMarquee: Directive = (el: HTMLElement) => {
    const text_el = el.children[0] as HTMLElement
    if (!text_el) return
    el.style.overflow = 'hidden'
    let ani_id = 0
    let offset = 1
    let _last_left = 0
    function marquee() {
        if (ani_id) {
            clearTimeout(ani_id)
        }

        _last_left = el.scrollLeft
        el.scrollLeft += offset
        if (_last_left === el.scrollLeft) {
            offset = -offset
        }
        
        ani_id = window.setTimeout(marquee, 100)
    }
    if (el.scrollLeft < text_el.offsetWidth) {
        el.addEventListener('mouseover', marquee)
        el.addEventListener('mouseleave', () => {
            clearTimeout(ani_id)
            el.scrollLeft = 0
        })
    }
}
