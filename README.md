This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Hero: pixel-unglitch

The hero ([src/components/Hero.tsx](src/components/Hero.tsx)) shows
`public/assets/wallpaper.jpg` full-bleed and fractures it under the pointer.

- **[PixelUnglitch.tsx](src/components/PixelUnglitch.tsx)** — canvas. The photo
  is the base layer; panes are drawn over it. The grid is tiled once per resize
  by a greedy random walk that drops variable-size rectangles (1×1 up to 6×2
  units), so panes interlock at irregular sizes instead of forming a uniform
  mosaic. A spotlight raises per-module "heat"; heat decays every frame, so the
  fracture trails the pointer and then heals. Panes reach full strength through
  a thin refracted fringe, a few sample a neighbouring slice, and random tear
  bursts rip horizontal bands sideways near the spotlight. Detached shards pop
  just outside it.
- **Glass materials** — each block is assigned one of four materials at build
  time: `mirror` flips the scene inside the pane, `frost` fakes a blur by
  round-tripping through a 10×10 buffer and adds a white veil, `lens`
  magnifies by sampling a smaller region across the same area, and `clear`
  refracts laterally so the picture steps sideways. Every pane then gets a raking sheen driven by
  `(x + y·0.65)` against time, so the whole cluster catches one light source,
  plus a bevel on one axis only — lit or shadowed depending on its seed, so the
  edges never line up into a tile grid.
- **Idle autoplay** — after 1.2s without pointer movement the spotlight drives
  itself along a wandering path over the subject, with more frequent tear
  bursts. Any pointer move takes control back. On coarse-pointer devices
  (`pointer: coarse`) there is no hovering pointer to wait for, so the scan
  never yields: it runs from load, 1.5× faster, with 1.5× the amplitude and a
  wider cluster (`w * 0.5` rather than `w * 0.4`). Tear bursts and debris go
  the other way there — rarer than on desktop — so the travelling scan reads as
  a sweep instead of random popping.
- **Reduced motion** — `prefers-reduced-motion` disables autoplay, bursts,
  debris and every glitch keyframe.

### Props

```tsx
<PixelUnglitch
  src="/assets/background.png"
  unit={18}            // base grid unit in px; modules are multiples of it
  radius={255}         // spotlight radius in px
  focus={[0.48, 0.3]}  // point of the photo to keep in frame (0-1)
  anchor={[0.56, 0.42]}// where that point lands on screen (0-1)
  zoom={1.08}          // extra zoom over cover-fit, leaving room to pan
/>
```

`unit` and `radius` scale down automatically on narrow viewports. At or below
`mobileMaxWidth` (640px by default) the component swaps to `mobileSrc` with its
own `mobileFocus` / `mobileAnchor` / `mobileZoom`, so the portrait crop gets its
own framing rather than a cover-fit of the wide art. The breakpoint resolves on
the first client render, so a phone only ever fetches the portrait file.
Swapping either photo is just a new `src` — retune `focus` to whatever the
subject is. With no `src` it renders a procedural neon scene instead.

### Word mark

The hero carries a two-face lockup: **Glitch** in
[Sacramento](https://fonts.google.com/specimen/Sacramento) followed by
**DECODED** in Asthetic Pixel — the OTF in
`public/assets`, self-hosted through `next/font/local` in
[layout.tsx](src/app/layout.tsx) and exposed as the `font-pixel` utility. It is
sized `clamp(3.5rem, 17vw, 15rem)` in `--yellow` with a hard offset shadow, and
sits bottom-aligned in the hero with the glass panes fracturing the photo
behind and through it.

[FitText.tsx](src/components/FitText.tsx) scales each line so it spans its
container exactly: it measures at a fixed 100px, then sets the size to
`100 * available / measured`. Children size themselves in `em`, so the mixed
faces scale as a unit. It refits on `document.fonts.ready` (web fonts land
after the first measure) and on resize, ignoring the observer callbacks its own
size change triggers.

Both layouts — one fitted line on `sm`+, two stacked fitted lines below — live
in the DOM and are toggled with CSS. Choosing between them in JS from a media
query diverges from the server render and trips hydration; the visible one is
picked by the stylesheet, and an `sr-only` span carries the text for assistive
tech since both variants are `aria-hidden`.

The file is the **Demo** cut of the family, which is normally personal-use
only — check the licence before this ships commercially. No `font-bold` is
applied: the face has one weight and synthetic bold would smear the pixel
grid.

**[GlitchNav.tsx](src/components/GlitchNav.tsx)** — fixed nav. Each label is a
`.glitch` element that renders two chromatic ghosts via `::before` / `::after`,
twitching rarely on a staggered delay and hard on hover/focus.
