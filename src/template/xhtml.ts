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

export { xhtml_template, cover_template }
