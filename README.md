*This package is **no longer maintained** and most likely **won't work with the newest version of svelte/sapper and rollup.***

# Svelte i-Pack

> A [Rollup](https://rollupjs.org) plugin for image optimization and auto generation of responsive images for [Svelte](https://svelte.dev).

\*This package is inspired by [Svelte Image](https://github.com/matyunya/svelte-image).
If you want more feature like Lazy loading with auto generated placeholder you should check Svelte Image out.

## Features

- Optimize png/jpg
- Generate And Add Webp
- Generate And Add Responsive Images
- Automatically Converts Images With A Small Fils Size To Inline Base64
- Clean Up And Make Sure There Is No Unused Image Left In The Served Folder

### Full Example

```html
<script>
  import Image from 'svelte-i-pack'
</script>

<image
  class="leaf"
  src="leaf.png"
  width="400*2"
  sizes="(min-width: 800px) 400px, 100vw"
  alt="Happa!"
  media="(max-width: 400px)"
  aSrc="grass.jpg"
  aWidth="40*3"
/>
```

Will generate

```html
<picture>
  <source
    type="image/webp"
    srcset="
      ipack/grass-120.webp 120w,
      ipack/grass-80.webp   80w,
      ipack/grass-40.webp   40w
    "
    sizes="40px"
  />
  <source
    srcset="
      ipack/grass-120.jpg 120w,
      ipack/grass-80.jpg   80w,
      ipack/grass-40.jpg   40w
    "
    sizes="40px"
  />
  <source
    type="image/webp"
    srcset="ipack/leaf-800.webp 800w, ipack/leaf-400.webp 400w"
    sizes="(min-width: 400px) 400px, 100vw"
  />
  <img
    class="leaf"
    srcset="ipack/leaf-800.png 800w, ipack/leaf-400.png 400w"
    sizes="(min-width: 400px) 400px, 100vw"
    alt="Happa!"
  />
</picture>
```

## Installation

```
yarn add -D svelte-i-pack
```

(_requires svelte >= v3_)

### With `Svelte`

Simply add iPack() in the rollup plugins _**before**_ svelte plugin.

```js
// rollup.config.js
import iPack from 'svelte-i-pack';

export default {
  ...,
  plugins: [
    iPack({ /* options */ }),
    svelte({ ... }),
    ...
  ]
}
```

### With `Sapper`

Pretty much the same as Svelte.
However, [Sapper](https://sapper.svelte.dev/) has two build configurations, one for the client bundle and one for the server.
To use `svelte-i-pack` with Sapper, you need to define it on both configurations.

```js
// ...
import iPack from 'svelte-i-pack';

const iPackOptions = { /* options if needed */ }

export default {
  client: {
    plugins: [
      iPack(iPackOptions),
      svelte({
        // ...
      }),
  },
  server: {
    plugins: [
      iPack(iPackOptions),
      svelte({
        // ...
      }),
    ],
  },
};
```

## Preprocessor Options and Defaults

`iPack processor` can receive an options object.

```js
const options = {
  /**
   * Specify input directory for your original images.
   * Original ones are simply treated as source and will not be included in the build.
   * Thus, you should not set it in ./static.
   **/
  inputDir: 'content/img',
  /**
   * Jpeg/webp quality level
   **/
  quality: 75,
  /**
   * Png quality level
   **/
  pngCompLevel: 8,
  /**
   * Images below the threshold will be encoded to base64 and be inlined.
   * In this case no image file will be generated.
   **/
  inlineThreshold: 5000,
  /**
   * If true, logs all an array of created and deleted images.
   **/
  logging: true,
}
```

### Image component props

`<Image>` component can recieve props below:

Standard html attributes. -These will be passed as normal attributes.

- `src` _(required) -relative and static path only_
- `class`
- `style`
- `media`
- `alt`
- `sizes`

  > When not specified, `sizes` will fall back to the value of the left part of the `width` - in the example below, `160px`.

> You cannot pass `width` and `height`.
> Use inline style or css instead.

iPack attributes.

- `width` _(required)_

  > This is completely different from the normal html `width` attribute. This prop controls the size and the number of image generated.

  > _syntax:_ `{actual.displayed.size}*{resolution}`

  > _example:_ `width="160*3"` will generate images with size of `[160, 320, 480]` for both png/jpg and webp.

* `aSrc`
* `aWIdth`
* `aSizes`
  > When you specify `media` in art direction scenarios, you can specify their `src`, `width`, `sizes` with these props. _(a = alternative)_
  > If you don't specify `aSizes`, value of the left part of the `aWidth` will be used.
* `no-inline`

  > Pass this prop if you don't want the image to be converted to inlined-base64. This should be desirable for the images that get used multiple times in the same page.

  > If you want to disable inline-img feature globally, set `inline-threshold` in preprocessor option to `0`.

---

## Some thoughts

### Class and scoped CSS

As you can see above, you can pass as many classes to `<Image>` component.

_However_, since Svelte's style is scoped by default, you need to tweek a little to apply the style you specified in the parent component to the `<Image>` component.

---

1. Use `:global` style

Change

```css
.callout {
  margin-right: 0.5rem;
  margin-top: 1.25rem;
}
```

to

```css
:global(.callout) {
  margin-right: 0.5rem;
  margin-top: 1.25rem;
}
```

---

2. Use utility-first css library like [Tailwind.css](https://tailwindcss.com)

```html
<image
  src="pc/2x/leaf3.png"
  width="160*2"
  sizes="160px"
  alt=""
  class="h-16 w-16 mx-auto"
/>
```

---

Both works, but using utility-first css should be slightly optimal.

By configuring Tailwind.css correctly you can eliminate the small overhead caused by :global-ing styles.
