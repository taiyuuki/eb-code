const xhtml_template = () => {
    return `
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">

<head>
    <title></title>
</head>

<body>
    <p></p>
</body>

</html>
    `.trim()
}

const cover_template = (width: number, height: number, href: string) => {
    return `
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">

<head>
    <title>Cover</title>
</head>

<body epub:type="cover">
    <div style="text-align: center; padding: 0pt; margin: 0pt;">
        <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1"
            viewBox="0 0 ${width} ${height}" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">
            <image width="${width}" height="${height}" xlink:href="${href}" />
        </svg>
    </div>
</body>

</html>
    `.trim()
}

const ncx_template = (uuid: string) => {
    return `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <head>
            <meta name="dtb:uid" content="urn:${uuid}" />
            <meta name="dtb:depth" content="0" />
            <meta name="dtb:totalPageCount" content="0" />
            <meta name="dtb:maxPageNumber" content="0" />
        </head>
    <docTitle>
        <text>Unknown</text>
    </docTitle>
    <navMap>

    </navMap>
    </ncx>`
}

export { xhtml_template, cover_template, ncx_template }
