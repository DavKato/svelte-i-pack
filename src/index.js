import path from 'path'
import fs from 'fs'

import {
  mkdirp,
  getAst,
  getNodes,
  getProps,
  getSizes,
  getOutPath,
  getLocalFiles,
  log,
  cleanUp,
} from './util'
import { insertBase64, replaceTag, resetOffset } from './insertBase64'
import generateImg from './generateImg'

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
export default (options = {}) => {
  options = {
    ...defaults,
    ...options,
    outputDir,
    server: false,
  }
  const stateStore = new Map()
  const localStore = new Set()
  let promiseList = []
  return {
    name: 'iPack',

    options(op) {
      if (op.input.server) options.server = true
    },

    transform(code, id) {
      if (path.extname(id) !== '.svelte' || !code.includes('<Image')) {
        return null
      }
      // Initialize
      this.addWatchFile(id)
      mkdirp(options.outputDir)
      if (localStore.size === 0) {
        getLocalFiles(options.outputDir).forEach(file => localStore.add(file))
      }
      stateStore.delete(id)
      stateStore.set(id, new Map())

      // Get Component Data
      const ast = getAst(code)
      const imgNodes = getNodes(ast)
      const processed = imgNodes.reduce(
        (processed, node) => {
          const [src, width, aSrc, aWidth, noInline] = getProps(node, [
            'src',
            'width',
            'aSrc',
            'aWidth',
            'no-inline',
          ])
          const inPath = path.resolve(options.inputDir, src)

          if (
            !noInline &&
            fs.statSync(inPath).size <= options.inlineThreshold
          ) {
            // The only code mutation in the plugin
            return insertBase64(processed.code, processed.offset, node, inPath)
          }
          if (noInline) {
            const { start, end } = noInline
            processed.code = replaceTag(
              processed.code,
              processed.offset,
              start,
              end,
            )
            processed.offset = resetOffset(processed.offset, start, end)
          }

          if (options.server) return processed

          // Set Component Data to State
          const setInfo = (width, inPath, options) => {
            const sizes = getSizes(width)
            sizes.forEach(size => {
              const output = getOutPath(size, inPath, options.outputDir)
              output.forEach(el => {
                stateStore.get(id).set(el, { input: inPath, size })
              })
            })
          }
          setInfo(width, inPath, options)
          if (aSrc) {
            const inPath = path.resolve(options.inputDir, aSrc)
            setInfo(aWidth, inPath, options)
          }

          return processed
        },
        {
          code,
          offset: 0,
        },
      )

      // Generate New Images
      const newFiles = []
      stateStore.get(id).forEach((val, key) => {
        if (!localStore.has(key)) {
          newFiles.push({
            input: val.input,
            output: key,
            size: val.size,
          })
        }
      })

      const promises = generateImg(newFiles, options)
      promises.forEach(promise => promiseList.push(promise))

      return {
        code: processed.code,
        map: null,
        ast,
      }
    },
    async buildEnd() {
      if (options.server) return
      const resolved = await Promise.all(promiseList)
      promiseList = []
      log('created', resolved, options.logging)

      localStore.clear()
      stateStore.forEach(val => val.forEach((v, key) => localStore.add(key)))
      cleanUp(options.outputDir, localStore, options.logging)
    },
  }
}
