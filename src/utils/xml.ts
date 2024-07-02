import xmlserializer from 'xmlserializer' // 原生XMLSerializer会删除prefix，所以用xmlserializer

function to_xhtml(html: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
       "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
       
    ${html}`
}

function xmlToDom(xml: string) {
    return new DOMParser().parseFromString(xml, 'application/xhtml+xml')
}

function domToXml(dom: Document | Element, type: 'xhtml' | 'xml' = 'xhtml') {
    return type === 'xhtml' 
        ? new XMLSerializer().serializeToString(dom) 
        : to_xhtml(xmlserializer.serializeToString(dom))
}

function domToObj(dom: Element) {
    const obj = {} as Record<string, any>
    obj.tagName = dom.tagName
    for (const key in dom.attributes) {
        const value = dom.attributes[key].value
        if (value) {
            const name = dom.attributes[key].name
            obj[name] = value
        }
    }
    obj.textContent = dom.textContent
    if (obj.id) {
        obj.r_id = obj.id
    }
    else if (obj.property) {
        if (obj.refines) {
            obj.r_id = obj.refines + obj.property
        }
        else {
            obj.r_id = obj.property
        }
    }
    else if (obj.textContent?.trim() !== '') {
        obj.r_id = obj.textContent
    }
    else if (obj.content) {
        obj.r_id = obj.content
    }
    else if (obj.name) {
        obj.r_id = obj.name
    } 

    return obj
}

function objToDom(obj: Record<string, any>, namespaceURI: string) {

    const dom = document.createElementNS(namespaceURI, obj.tagName, { is: obj.tagName })
    const ignores = ['tagName', 'textContent', 'r_id', 'children']
    for (const attr in obj) {
        if (ignores.includes(attr)) {
            continue
        }
        dom.setAttribute(attr, obj[attr])
    }

    if (obj.textContent) {
        dom.textContent = obj.textContent
    }

    return dom
}

function check_xml(xml: string) {
    try {
        const dom = new DOMParser().parseFromString(xml, 'application/xhtml+xml')
        if (dom.getElementsByTagName('parsererror').length > 0) {
            return false
        }

        return dom
    }
    catch (_) {
        return false
    }
}

function split(element: HTMLElement) {
    const parent = element.parentNode!
    const index = Array.from(parent.childNodes).indexOf(element)
    const before = parent.cloneNode(false) as HTMLElement
    const after = parent.cloneNode(false) as HTMLElement

    let i = index - 1
    let child = parent.childNodes[0]
    while (child && i >= 0) {
        before.appendChild(child)
        child = parent.childNodes[0]
        i--
    }

    child = parent.childNodes[1]
    while (child) {
        after.appendChild(child)
        child = parent.childNodes[1]
    }

    return { before, after }
}

function split_DOM(element: HTMLElement) {
    let { before, after } = split(element)
    let parent = element.parentNode! as HTMLElement
    while (parent && parent.tagName !== 'body' && parent.parentNode) {
        const { before: p_before, after: p_after } = split(parent)
        p_before.appendChild(before)
        p_after.insertBefore(after, p_after.firstChild)
        before = p_before
        after = p_after
        parent = parent.parentNode! as HTMLElement
    }

    return { before, after }
}

export {
    to_xhtml,
    xmlToDom,
    domToXml,
    domToObj,
    objToDom,
    check_xml,
    split_DOM,
}
