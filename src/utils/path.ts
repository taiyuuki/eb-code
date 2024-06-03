/**
 * 包含扩展名的文件名
 * @param path 完整路径
 * @returns 
 */
function basename(path: string) {
    const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))

    return i === -1 ? path : path.substring(i + 1)
}

/**
 * 不包含扩展名的文件名
 * @param path 
 * @returns 
 */
function filename(path: string) {
    const bn = basename(path)

    return bn.substring(0, bn.lastIndexOf('.'))
}

/**
 * 文件扩展名
 * @param path 
 * @returns 
 */
function extname(path: string) {
    return path.split('.').pop() ?? 'unknown'
}

/**
 * 计算目标路径与源路径的相对路径
 * @param target - 目标路径
 * @param from - 源路径
 * @returns 相对路径
 */
function relative(target: string, from: string) {
    target = `root/${target}`
    from = `root/${from}`
    const f = target.split('/')
    f.shift()
    const t = from.split('/') 
    t.shift()

    let num = 0
    for (let i = 0; i < f.length; i++) {
        if(f[i] === t[i]) {
            num++
        } else {
            break
        }
    }
    f.splice(0, num)
    t.splice(0, num)
    let rel_path = ''
    for (let j = 0; j < t.length - 1; j++) {
        rel_path += '../'
    }

    rel_path += f.join('/')

    return rel_path
}

/**
 * 文件类型
 * @param path 
 * @returns 
 */
function mimetype(path: string) {
    const ext = extname(path).toLowerCase()
    switch (ext) {
        case 'html':
        case 'htm':
            return 'text/html'
        case 'xhtml':
            return 'application/xhtml+xml'
        case 'xml':
            return 'application/xml'
        case 'css':
            return 'text/css'
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'png':
            return 'image/png'
        case 'gif':
            return 'image/gif'
        case 'svg':
            return 'image/svg+xml'
        case 'ico':
            return 'image/x-icon'
        case 'webp':
            return 'image/webp'
        case 'avif':
            return 'image/avif'
        case 'tif':
        case 'tiff':
            return 'image/tiff'
        case 'ttf':
            return 'font/ttf'
        case 'otf':
            return 'font/otf'
        case 'woff':
            return 'font/woff'
        case 'woff2':
            return 'font/woff2'
        case 'mp3':
            return 'audio/mpeg'
        case 'wav':
            return 'audio/wav'
        case 'ogg':
            return 'audio/ogg'
        case 'mp4':
            return 'video/mp4'
        case 'webm':
            return 'video/webm'
        case 'mkv':
            return 'video/x-matroska'
        default:
            return 'text/plain'
    }
}

function dirname(path: string) {
    return path.substring(0, path.lastIndexOf('/'))
}

function join(...paths: string[]) {
    const path = ''

    return paths.reduce((path, b, i) => {
        if (b.endsWith('/')) {
            b = b.substring(0, b.length - 1)
        }
        if (i === 0) {
            if (b.startsWith('/')) {
                return b.substring(1)
            } else if (b.startsWith('./')) {
                return b.substring(2)
            } else {
                return b
            }
        } else if (b.startsWith('/')) {
            return path + b
        } else if (b.startsWith('./')) {
            return path + b.substring(1)
        } else if (b.startsWith('../')) {
            return path.substring(0, path.lastIndexOf('/') + 1) + b.substring(3)

        } else if (path === '') {
            return b
        } else {
            return `${path}/${b}`
        }
    }, path)
}

export {
    basename,
    filename,
    extname,
    mimetype,
    dirname,
    join,
    relative,
}
