import fs from 'fs'

const base64converter = inPath => {
  const s = fs.readFileSync(inPath, 'base64')
  return `src="data:image/png;base64, ${s}"`
}

const filterAttr = node => {
  const trash = [
    'src',
    'width',
    'sizes',
    'media',
    'aSrc',
    'aWidth',
    'aSizes',
    'no-inline',
  ]
  return node.attributes.filter(attr => !trash.includes(attr.name))
}

const appendAttr = (src, attrArr) => {
  return attrArr.reduce((acc, el) => {
    const value = el.value[0] ? el.value[0].data : ''
    return `${acc} ${el.name}="${value}"`
  }, src)
}

const tagBuilder = newAttr => `<img ${newAttr}>`

export const replaceTag = (code, offset, start, end, newTag) => {
  const pre = code.substring(0, start + offset)
  const post = code.substring(end + offset)
  return newTag ? pre + newTag + post : pre + post
}

export const resetOffset = (offset, start, end, newTag) => {
  return newTag ? newTag.length - (end - start) + offset : end - start + offset
}

export const insertBase64 = (code, offset, node, inPath) => {
  const { start, end } = node

  const newSrc = base64converter(inPath)
  const filteredAttr = filterAttr(node)
  const newAttr = appendAttr(newSrc, filteredAttr)
  const newTag = tagBuilder(newAttr)
  code = replaceTag(code, offset, start, end, newTag)
  offset = resetOffset(offset, start, end, newTag)

  return { code, offset }
}
