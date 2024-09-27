const DISPLAY = {
    NONE: 0,
    CODE: 1,
    IMAGE: 2,
    METADATA: 3,
    AUDIO: 4,
}

const NOT_SUPPORTED_THEMES = [
    'github-dark-default', 
    'github-dark-dimmed',
    'github-dark-high-contrast',
    'vesper',
]

const TREE = {
    HTML: 0,
    STYLE: 1,
    IMAGE: 2,
    FONT: 3,
    JS: 4,
    AUDIO: 5,
    VIDEO: 6,
    OTHER: 7,
}

const SAVE_DELAY = 800

const SSV = {
    'cover': '封面',
    'titlepage': '标题页',
    'toc': '目录',
    'copyright-page': '版权页',
    'contributors': '贡献者',
    'dedication': '致谢（作者）',
    'acknowledgments': '致谢（机构）',
    'foreword': '序言',
    'preface': '前言',
    'chapter': '章节',
    'part': '分章',
    'bodymatter': '正文',
    'appendix': '附录',
    'afterword': '后记',
    'colophon': '作者签名',
    'glossary': '词汇表',
    'biblioentry': '参考文献',
    'bibliography': '参考书目',
    'index': '索引',
    'loi': '插图列表',
    'loa': '音频列表',
    'lot': '表格列表',
    'lov': '视频列表',
}

export { 
    DISPLAY,
    NOT_SUPPORTED_THEMES, 
    TREE,
    SAVE_DELAY,
    SSV,
}
