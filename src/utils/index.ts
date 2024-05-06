function setOpacity(color: string, opacity: number) {
    const reg = /^#([\dA-f]{3}|[\dA-f]{6})$/
    if (reg.test(color)) {
        if (color.length === 4) {
            const temp = color.split('')
            color = temp[0] + temp[1] + temp[1] + temp[2] + temp[2] + temp[3] + temp[3]
        }
        const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)
            .toString(16)
            .toUpperCase()

        return color + alpha
    } else {
        return color
    }
}

function is_text(name: string) {
    return name.endsWith('.html') 
        || name.endsWith('.xhtml')
        || name.endsWith('.css')
        || name.endsWith('.opf')
        || name.endsWith('.ncx')
        || name.endsWith('.xml') 
        || name.endsWith('.htm')
        || name.endsWith('.txt')
        || name.endsWith('.json')
        || name.endsWith('.js')
      
}

function basename(path: string) {
    return path.split('/').pop()!
}

function filename(path: string) {
    return path.split('/').pop()!.split('.')[0]
}

export { setOpacity, is_text, basename, filename }
