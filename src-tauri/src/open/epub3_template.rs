pub const OPF: &str = r#"<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="BookId" xmlns="http://www.idpf.org/2007/opf">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier id="BookId">urn:uuid:16c7396a-f330-4796-87d9-5bc4341325ef</dc:identifier>
        <dc:language>en</dc:language>
        <dc:title>[Title]</dc:title>
        <meta property="dcterms:modified">2024-05-29T11:51:21Z</meta>
    </metadata>
    <manifest>
        <item id="Section0001.xhtml" href="Text/Section0001.xhtml" media-type="application/xhtml+xml"/>
        <item id="nav.css" href="Styles/nav.css" media-type="text/css"/>
        <item id="nav.xhtml" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    </manifest>
    <spine>
        <itemref idref="Section0001.xhtml"/>
    </spine>
</package>"#;

pub const NAV: &str = r##"<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
    <title>ePub NAV</title>
    <meta charset="utf-8" />
    <link href="../Styles/nav.css" rel="stylesheet" type="text/css"/></head>
<body epub:type="frontmatter">
    <nav epub:type="toc" id="toc" role="doc-toc">
        <h1>Contents</h1>
        <ol>
            <li>
                <a href="Text/Section0001.xhtml">Section0001</a>
            </li>
        </ol>
    </nav>
    <nav epub:type="landmarks" id="guide">
        <h2>Guide</h2>
        <ol>
            <li>
                <a epub:type="toc" href="Text/nav.xhtml">Toc</a>
            </li>
        </ol>
    </nav>
</body>
</html>"##;

pub const NAV_CSS: &str = r##"nav#guide {
    display:none;
}

ol {
    list-style-type: none;
}"##;
