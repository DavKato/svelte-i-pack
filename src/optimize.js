import fs from 'fs'
import path from 'path'

import sharp from 'sharp'

// to: "./static/ipack/about-davigobu-188.png"
const getOutPath = (size, inPath, outputDir) => {
  const { name, ext } = path.parse(inPath)
  const withoutExt = path.resolve(outputDir, name) + `-${size}`
  const outPath = [`${withoutExt}${ext}`, `${withoutExt}.webp`]
  return outPath
}

const outputOriginal = (size, inPath, outPath, options) => {
  if (!fs.existsSync(outPath)) {
    return sharp(inPath)
      .resize({ width: size })
      .jpeg({ quality: options.quality, force: false })
      .png({ compressionLevel: options.pngCompLevel, force: false })
      .toFile(outPath)
  }
}

const outputWebp = (size, inPath, outPath, options) => {
  if (!fs.existsSync(outPath)) {
    return sharp(inPath)
      .resize({ width: size })
      .webp({ quality: options.quality })
      .toFile(outPath)
  }
}

export default (sizes, inPath, options) => {
  const promises = []
  const files = sizes.flatMap(size => {
    const outPath = getOutPath(size, inPath, options.outputDir)
    promises.push(outputOriginal(size, inPath, outPath[0], options))
    promises.push(outputWebp(size, inPath, outPath[1], options))
    return outPath
  })

  return [files, promises]
}
