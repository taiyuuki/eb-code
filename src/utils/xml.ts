function xmlToDom(xml: string) {
    return new DOMParser().parseFromString(xml, 'text/xml')
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
    obj.textContents = dom.textContent

    return obj
}

function objToDom(obj: Record<string, any>) {
    const dom = document.createElement(obj.tagName)
    for (const attr in obj) {
        if (attr !== 'tagName') {
            dom.setAttribute(attr, obj[attr])
        }
    }

    if (obj.textContents) {
        dom.textContent = obj.textContents
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
