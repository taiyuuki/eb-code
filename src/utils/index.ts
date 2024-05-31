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

function escape_regexp(str: string) {
    return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
}

export { set_opacity, escape_regexp }
