import { describe, expect, it } from 'vitest'
import {
    basename,
    dirname,
    extname,
    filename,
    join,
    mimetype,
    relative,
} from '../src/utils/path'

describe('path', () => {
    it('basename', () => {
        expect(basename('a/b/c.txt')).toBe('c.txt')
    })
    it('filename', () => {
        expect(filename('a/b/c.txt')).toBe('c')
    })
    it('extname', () => {
        expect(extname('a/b/c.txt')).toBe('txt')
    })
    it('mimetype', () => {
        expect(mimetype('a/b/c.txt')).toBe('text/plain')
        expect(mimetype('a/b/c.html')).toBe('text/html')
        expect(mimetype('a/b/c.xhtml')).toBe('application/xhtml+xml')
        expect(mimetype('a/b/c.png')).toBe('image/png')
    })
    it('dirname', () => {
        expect(dirname('a/b/c.txt')).toBe('a/b')
        expect(dirname('xml/vol.ncx')).toBe('xml')
        expect(dirname('vol.ncx')).toBe('')
    })
    it('join', () => {

        expect(join('a', 'b', 'c.txt')).toBe('a/b/c.txt')
        expect(join('aa', '../b/c.txt')).toBe('b/c.txt')
        expect(join('aaa/', '/b', 'c.txt')).toBe('aaa/b/c.txt')
        expect(join('aaa/', '/b', '../c.txt')).toBe('aaa/c.txt')
        expect(join('a/', '../b', './c.txt')).toBe('b/c.txt')
        expect(join('./a/b/c/', '../d', '../e.txt')).toBe('a/b/e.txt')
        expect(join('xml', '../html/p-001.xhtml')).toBe('html/p-001.xhtml')
        expect(join(dirname('xml/vol.ncx'), '../html/p-001.xhtml')).toBe('html/p-001.xhtml')
        expect(join(dirname('vol.ncx'), 'html/p-001.xhtml')).toBe('html/p-001.xhtml')
    })
    it('relative', () => {  
        expect(relative('a/b/c.txt', 'a/b/d.txt')).toBe('c.txt')
    })
})
