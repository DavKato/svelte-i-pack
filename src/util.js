import fs from 'fs'
import path from 'path'

import svelte from 'svelte/compiler'

export const mkdirp = dir => {
  if (typeof dir === 'string') {
    if (fs.existsSync(dir)) {
      return dir
    }
    return mkdirp(dir.split('/'))
  }

  return dir.reduce((created, nextPart) => {
    const newDir = path.join(created, nextPart)
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir)
    }
    return newDir
  }, '')
}

export const getAst = content => svelte.parse(content)

export const getNodes = ast => {
  const imageNodes = []
  svelte.walk(ast, {
    enter: node => {
      if (node.type !== 'InlineComponent') {
        return
      }
      if (node.name === 'Image') {
        imageNodes.push(node)
      }
    },
  })
  return imageNodes
}

export const getProps = (node, attrs) => {
  const arr = attrs.map(el => node.attributes.find(a => a.name === el) || null)
  return arr.map(el => {
    if (!el) return el
    return Array.isArray(el.value) ? el.value[0].data : el
  })
}

export const getSizes = rawWidth => {
  let [width, resolution] = rawWidth.split('*').map(el => Number(el))
  const widthArr = []
  for (resolution; resolution > 0; resolution--) {
    widthArr.push(Math.ceil(width * resolution))
  }
  return widthArr
}

export const getOutPath = (size, inPath, outputDir) => {
  const { name, ext } = path.parse(inPath)
  const withoutExt = path.resolve(outputDir, name) + `-${size}`
  const outPath = [`${withoutExt}${ext}`, `${withoutExt}.webp`]
  return outPath
}

export const getLocalFiles = outDir =>
  fs.readdirSync(outDir).map(el => path.resolve(outDir, el))

export const log = (title, arr, logging) => {
  if (arr.length > 0 && logging) {
    arr = arr.map(el => path.relative('./', el))
    const color =
      title === 'deleted' ? '\x1b[91m%s\x1b[0m' : '\x1b[36m%s\x1b[0m'
    console.log('\n🖼  iPack')
    console.log(color, title, arr, '\n')
  }
}

export const cleanUp = (outDir, activeFiles, logging) => {
  const deleted = []
  const dir = getLocalFiles(outDir)
  dir.forEach(file => {
    if (!activeFiles.has(file)) {
      fs.unlinkSync(file)
      deleted.push(file)
    }
  })
  log('deleted', deleted, logging)
}
