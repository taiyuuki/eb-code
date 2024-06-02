function escape_regexp(str: string) {
    return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
}

export { escape_regexp }
