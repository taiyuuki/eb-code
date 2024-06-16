import type { Directive } from 'vue'

const vVisible: Directive = (el: HTMLElement, bind) => {
    
    if (bind.value) {
        el.style.visibility = 'visible'
    }
    else {
        el.style.visibility = 'hidden'
    }
}

export { vVisible }
