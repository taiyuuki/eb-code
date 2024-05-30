pub const OPF: &str = r#"<?xml version="1.0" encoding="utf-8"?>
<package version="2.0" unique-identifier="BookId" xmlns="http://www.idpf.org/2007/opf">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier opf:scheme="UUID" id="BookId">urn:uuid:{uuid}</dc:identifier>
        <dc:language>en</dc:language>
        <dc:title>[Title]</dc:title>
    </metadata>
    <manifest>
        <item id="Section0001.xhtml" href="Text/Section0001.xhtml" media-type="application/xhtml+xml"/>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="Section0001.xhtml" linear="yes" />
    </spine>
</package>"#;

pub const NCX: &str = r#"<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:{uuid}" />
        <meta name="dtb:depth" content="0" />
        <meta name="dtb:totalPageCount" content="0" />
        <meta name="dtb:maxPageNumber" content="0" />
    </head>
<docTitle>
    <text>Unknown</text>
</docTitle>
<navMap>
<navPoint id="navPoint-1" playOrder="1">
</navPoint>
</navMap>
</ncx>
"#;
