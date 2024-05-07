class HTMLEventManage<K extends keyof HTMLElementEventMap> {
    target: HTMLElement
    type: K
    listener: (ev: HTMLElementEventMap[K])=> any

    constructor(target: HTMLElement, type: K, listener: (ev: HTMLElementEventMap[K])=> any) {
        this.target = target,
        this.type = type,
        this.listener = listener
    }
  
    addEventListener() {
        this.target.addEventListener(this.type, this.listener)

        return this
    }
  
    removeEventListener() {
        this.target.removeEventListener(this.type, this.listener)
    }
}
  
class WindowEventManage<K extends keyof WindowEventMap> {
    type: K
    listener: EventListenerOrEventListenerObject

    constructor(type: K, listener: EventListenerOrEventListenerObject) {
        this.type = type,
        this.listener = listener
    }
  
    addEventListener() {
        window.addEventListener(this.type, this.listener)

        return this
    }
  
    removeEventListener() {
        window.removeEventListener(this.type, this.listener)
    }
}
  
export { HTMLEventManage, WindowEventManage }
