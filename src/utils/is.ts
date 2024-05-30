
function is_text(name: string) {
    return name.endsWith('.html') 
        || name.endsWith('.xhtml')
        || name.endsWith('.css')
        || name.endsWith('.opf')
        || name.endsWith('.ncx')
        || name.endsWith('.xml') 
        || name.endsWith('.htm')
        || name.endsWith('.txt')
        || name.endsWith('.json')
        || name.endsWith('.js')
      
}

function is_image(name: string) {
    return name.endsWith('.png') 
        || name.endsWith('.jpg') 
        || name.endsWith('.jpeg') 
        || name.endsWith('.gif') 
        || name.endsWith('.svg')
        || name.endsWith('.ico')
        || name.endsWith('.webp')
        || name.endsWith('.avif')
        || name.endsWith('.tif')
        || name.endsWith('.tiff')
}

function is_font(name: string) {
    return name.endsWith('.ttf')
        || name.endsWith('.otf')
        || name.endsWith('.woff')
        || name.endsWith('.woff2')
}

function is_html(name: string) {
    return name.endsWith('.xhtml')
        || name.endsWith('.html')
        || name.endsWith('.htm')
}

function is_audio(name: string) {
    return name.endsWith('.mp3')
        || name.endsWith('.wav')
        || name.endsWith('.ogg')
}

function is_video(name: string) {
    return name.endsWith('.mp4')
        || name.endsWith('.mkv')
        || name.endsWith('.webm')
}

function is_style(name: string) {
    return name.endsWith('.css')
}

function is_scripts(name: string) {
    return name.endsWith('.js')
}

export{
    is_text,
    is_image,
    is_style,
    is_font,
    is_html,
    is_audio,
    is_video,
    is_scripts,
}
