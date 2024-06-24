function escape_regexp(str: string) {
    return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
}

function de_escape(str: string) {
    return JSON.parse(`"${str}"`)
}

export { escape_regexp, de_escape }
