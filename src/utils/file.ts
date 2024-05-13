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
    return basename(path).substring(0, path.lastIndexOf('.'))
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

export {
    basename,
    filename,
    extname,
    mimetype,
}
