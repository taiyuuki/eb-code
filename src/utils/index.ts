function set_opacity(color: string, opacity: number) {
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

function is_image(name: string) {
    return name.endsWith('.png') 
        || name.endsWith('.jpg') 
        || name.endsWith('.jpeg') 
        || name.endsWith('.gif') 
        || name.endsWith('.svg')
        || name.endsWith('.ico')
        || name.endsWith('.webp')
        || name.endsWith('.avif')
        || name.endsWith('.tif')
        || name.endsWith('.tiff')
}

function basename(path: string) {
    if (path === '') return ''
    const SEPARATOR = path.includes('\\') ? '\\' : '/'

    return path.split(SEPARATOR).pop()!
}

function filename(path: string) {
    if (path === '') return ''
    const SEPARATOR = path.includes('\\') ? '\\' : '/'

    return path.split(SEPARATOR).pop()!.split('.')[0]
}

export { set_opacity, is_text, basename, filename, is_image }
