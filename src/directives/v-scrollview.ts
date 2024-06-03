import type { Directive } from 'vue'

function isInViewPort(el: HTMLElement) {
    let parent = el.parentElement
    while (parent && !parent.classList.contains('scroll')) {
        parent = parent.parentElement
    }

    if (parent) {
        const { top: p_top, left: p_left } = parent.getBoundingClientRect()
        const { top, left } = el.getBoundingClientRect()
        const { clientHeight: p_clientHeight, clientWidth: p_clientWidth } = parent
        const { clientHeight, clientWidth } = el

        return top > p_top && top + clientHeight < p_top + p_clientHeight || left > p_left && left + clientWidth < p_left + p_clientWidth
    }
    
    return true
}

const vScrollview: Directive = (el: HTMLElement, bind) => {
    
    if (bind.value && bind.oldValue !== bind.value && !isInViewPort(el)) {
        el.scrollIntoView()
    }
}

export { vScrollview }
