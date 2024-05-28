import type { Directive } from 'vue'

function isInViewPort(el: HTMLElement) {
    const viewWidth = window.innerWidth || document.documentElement.clientWidth
    const viewHeight = window.innerHeight || document.documentElement.clientHeight
    const {
        top,
        right,
        bottom,
        left,
    } = el.getBoundingClientRect()
   
    return (
        top >= 0
        && left >= 0
        && right <= viewWidth
        && bottom <= viewHeight
    )
}

const vScrollview: Directive = (el: HTMLElement, bind) => {
    
    if (bind.value && bind.oldValue !== bind.value && !isInViewPort(el)) {
        el.scrollIntoView()
    }
}

export { vScrollview }
