import type { Directive } from 'vue'

const vMove: Directive = {
    mounted(el: HTMLElement) {
        const container = el.parentElement!
        container.style.position = 'absolute'
        el.addEventListener('mousedown', e => {
            const { clientX, clientY } = e
            const { left, top } = container.getBoundingClientRect()
            const offsetX = clientX - left
            const offsetY = clientY - top
            const move = (e: MouseEvent) => {
                const { clientX, clientY } = e
                const left = Math.min(Math.max(clientX - offsetX, 0), window.innerWidth - container.offsetWidth)
                const top = Math.min(Math.max(clientY - offsetY, 0), window.innerHeight - container.offsetHeight)
                container.style.left = `${left}px`
                container.style.top = `${top}px`
            }
            const up = () => {
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        })
    },
}

export { vMove }
