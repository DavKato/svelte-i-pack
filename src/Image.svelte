<script>
  export let src,
    width,
    sizes = `${width.split('*')[0]}px`,
    alt = '',
    media = null,
    aSrc = null,
    aWidth = null,
    aSizes = aWidth ? `${aWidth.split('*')[0]}px` : null,
    style = ''
  let className = ''
  export { className as class }
  const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x)
  const outDir = 'ipack'

  const widthToArr = obj => {
    let [width, resolution] = obj.width.split('*').map(el => Number(el))
    const widthArr = []
    for (resolution; resolution > 0; resolution--) {
      widthArr.push(Math.ceil(width * resolution))
    }
    return { ...obj, width: widthArr }
  }

  const getFileName = src => {
    return src
      .split('/')
      .slice(-1)
      .join('')
  }

  const setNameAndMime = obj => {
    const filename = getFileName(obj.src).split('.')
    const orgMime = filename.splice(-1, 1).join('')
    const name = filename.join('.')
    const mime = obj.mime || orgMime

    return { name, width: obj.width, mime }
  }

  const getSrcsetWithWidths = (name, mime) => (acc, el) =>
    acc + `${outDir}/${name}-${el}.${mime} ${el}w,`

  const dataToStr = obj =>
    obj.width.reduce(getSrcsetWithWidths(obj.name, obj.mime), '')

  const removeLastComma = str => str.slice(0, -1)

  const setSrcset = pipe(widthToArr, setNameAndMime, dataToStr, removeLastComma)

  const fallbackSrcset = setSrcset({ src, width })
  const t = fallbackSrcset
    .split(',')
    .slice(-1)
    .join('')
  const i = t.indexOf(' ')
  const lastResort = t.substring(0, i)
</script>

<picture>
  {#if (media && aSrc && aWidth)}
  <source
    {media}
    type="image/webp"
    srcset="{setSrcset({src: aSrc, width: aWidth, mime: 'webp'})}"
    sizes="{aSizes}"
  />
  <source
    {media}
    srcset="{setSrcset({src: aSrc, width: aWidth})}"
    sizes="{aSizes}"
  />
  {/if}

  <source
    type="image/webp"
    srcset="{setSrcset({src, width, mime: 'webp'})}"
    {sizes}
  />
  <img
    class="{className}"
    srcset="{fallbackSrcset}"
    src="{lastResort}"
    {sizes}
    {alt}
    {style}
  />
</picture>
