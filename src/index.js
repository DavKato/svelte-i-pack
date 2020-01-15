import path from 'path'
import fs from 'fs'

import { mkdirp, getAst, getNodes, getProps, getSizes, cleanUp } from './util'
import base64Processor from './toBase64'
import imageProcessor from './optimize'

/** OPTIONS */
const defaults = {
  inputDir: 'content/img',
  quality: 75,
  pngCompLevel: 8,
  inlineThreshold: 5000,
  logging: true,
}

/** ENVIRONMENT */
const outputDir = fs.existsSync('./static')
  ? './static/ipack'
  : './public/ipack'

/** CODE */
const processManager = (content, imgNodes, options) => {
  const completed = imgNodes.reduce(
    (processed, node) => {
      const [src, width, noInline] = getProps(node, [
        'src',
        'width',
        'no-inline',
      ])

      const inPath = path.resolve(options.inputDir, src)

      if (!noInline && fs.statSync(inPath).size <= options.inlineThreshold) {
        const inlined = base64Processor(
          processed.content,
          processed.offset,
          node,
          inPath,
        )
        return { ...processed, ...inlined }
      }

      const sizes = getSizes(width)
      const [files, promises] = imageProcessor(sizes, inPath, options)

      files.forEach(el => processed.files.push(el))
      promises.forEach(el => processed.promises.push(el))

      const [aSrc, aWidth] = getProps(node, ['aSrc', 'aWidth'])
      if (aSrc) {
        const aInPath = path.resolve(options.inputDir, aSrc)
        const aSizes = getSizes(aWidth)
        const [files, promises] = imageProcessor(aSizes, aInPath, options)
        files.forEach(el => processed.files.push(el))
        promises.forEach(el => processed.promises.push(el))
      }

      return processed
    },
    {
      content,
      offset: 0,
      files: [],
      promises: [],
    },
  )

  return {
    processed: completed.content,
    files: completed.files,
    promises: completed.promises,
  }
}

const iPack = (content, options) => {
  if (!content.includes('<Image')) {
    return { processed: content, files: [], promises: [] }
  }

  mkdirp(options.outputDir)
  const ast = getAst(content)
  const imgNodes = getNodes(ast)

  return processManager(content, imgNodes, options)
}

export default (options = {}) => {
  options = {
    ...defaults,
    ...options,
    outputDir,
  }
  const activeList = new Set()
  const promiseList = []
  return {
    name: 'iPack',
    transform(code, id) {
      if (path.extname(id) !== '.svelte') return null

      const { processed, files, promises } = iPack(code, options)

      files.forEach(el => activeList.add(el))
      promiseList.concat(promises)

      return {
        code: processed,
        map: null,
      }
    },
    async buildEnd() {
      await Promise.all(promiseList)
      cleanUp(options.outputDir, activeList, options.logging)
    },
  }
}
