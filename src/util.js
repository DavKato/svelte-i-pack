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
  return arr.map(el => (el ? el.value[0].data : el))
}

export const getSizes = rawWidth => {
  let [width, resolution] = rawWidth.split('*').map(el => Number(el))
  const widthArr = []
  for (resolution; resolution > 0; resolution--) {
    widthArr.push(Math.ceil(width * resolution))
  }
  return widthArr
}

export const cleanUp = (outDir, activeFiles, logging) => {
  const deleted = []
  const dir = fs.readdirSync(outDir)
  dir.forEach(filename => {
    const file = path.resolve(outDir, filename)
    if (!activeFiles.includes(file)) {
      fs.unlinkSync(file)
      deleted.push(file)
    }
  })
  if (deleted.length > 0 && logging) {
    console.log('\x1b[36m%s\x1b[0m', '\n🖼  iPack')
    console.log('\x1b[91m%s\x1b[0m', 'deleted:', deleted, '\n')
  }
}
