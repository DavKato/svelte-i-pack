import path from 'path'

import sharp from 'sharp'

const outputOriginal = (input, output, size, options) => {
  return new Promise((resolve, reject) => {
    sharp(input)
      .resize({ width: size })
      .jpeg({ quality: options.quality, force: false })
      .png({ compressionLevel: options.pngCompLevel, force: false })
      .toFile(output, () => resolve(output))
  })
}

const outputWebp = (input, output, size, options) => {
  return new Promise((resolve, reject) => {
    sharp(input)
      .resize({ width: size })
      .webp({ quality: options.quality })
      .toFile(output, () => resolve(output))
  })
}

export default (sourceArr, options) => {
  const promises = []
  sourceArr.forEach(source => {
    const { input, output, size } = source
    const outExt = path.extname(output)
    outExt === '.webp'
      ? promises.push(outputWebp(input, output, size, options))
      : promises.push(outputOriginal(input, output, size, options))
  })
  return promises
}
