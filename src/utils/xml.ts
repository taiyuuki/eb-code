function xmlToDom(xml: string) {
    return new DOMParser().parseFromString(xml, 'application/xhtml+xml')
}

function domToXml(dom: any) {
    return new XMLSerializer().serializeToString(dom)
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
    } else if (obj.property) {
        if (obj.refines) {
            obj.r_id = obj.refines + obj.property
        } else {
            obj.r_id = obj.property
        }
    } else if (obj.textContent?.trim() !== '') {
        obj.r_id = obj.textContent
    } else if (obj.content) {
        obj.r_id = obj.content
    } else if (obj.name) {
        obj.r_id = obj.name
    } 

    return obj
}

function objToDom(obj: Record<string, any>, namespaceURI: string) {
    const dom = document.createElementNS(namespaceURI, obj.tagName)
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
        const dom = new DOMParser().parseFromString(xml, 'text/xml')
        if (dom.getElementsByTagName('parsererror').length > 0) {
            return false
        }

        return true
    } catch (_) {
        return false
    }
}

export {
    xmlToDom,
    domToXml,
    domToObj,
    objToDom,
    check_xml,
}
