import fs from 'fs'

const base64converter = inPath => {
  const s = fs.readFileSync(inPath, 'base64')
  return `src="data:image/png;base64, ${s}"`
}

const isTrash = name => {
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
  return trash.some(el => el === name)
}

const deleteAttr = (code, node, src) => {
  return node.attributes.reduce((acc, el) => {
    if (isTrash(el.name)) {
      return acc
    }
    const attr = code.substring(el.start, el.end)
    return `${acc} ${attr}`
  }, src)
}

const tagBuilder = newAttr => `<img ${newAttr}>`

export const replaceTag = (code, offset, start, end, newTag) => {
  const pre = code.substring(0, start + offset)
  const post = code.substring(end + offset)
  return pre + newTag + post
}

export const resetOffset = (offset, start, end, newTag) => {
  return newTag.length - (end - start) + offset
}

export const insertBase64 = (code, offset, node, inPath) => {
  const { start, end } = node

  const newSrc = base64converter(inPath)
  const filteredAttr = deleteAttr(code, node, newSrc)
  const newTag = tagBuilder(filteredAttr)
  code = replaceTag(code, offset, start, end, newTag)
  offset = resetOffset(offset, start, end, newTag)

  return { code, offset }
}
