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

The hero ([src/components/Hero.tsx](src/components/Hero.tsx)) paints a solid red
plate over `public/assets/background.png` and dissolves it block by block.

- **[PixelUnglitch.tsx](src/components/PixelUnglitch.tsx)** — canvas. The grid is
  tiled once per resize by a greedy random walk that drops variable-size
  rectangles (1×1 up to 6×2 units), so blocks interlock at irregular sizes
  instead of forming a uniform mosaic. A spotlight raises per-module "heat";
  heat decays every frame, so the reveal trails and reseals. Modules snap to
  full opacity through a thin translucent fringe, a slice of them render as flat
  posterised chunks sampled from the photo, a few pull content from a
  neighbouring slice, and random tear bursts rip horizontal bands sideways near
  the spotlight. Detached debris blocks pop just outside it.
- **Idle autoplay** — after 1.2s without pointer movement the spotlight drives
  itself along a wandering path over the subject's face, with more frequent
  tear bursts. Any pointer move takes control back.
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

`unit` and `radius` scale down automatically on narrow viewports. Swapping the
photo is just a new `src` — retune `focus` to whatever the subject is. With no
`src` it renders a procedural neon scene instead.

### Headline

A two-column, two-row grid fills the space under the eyebrow: **EXPLORE THE /
Glitch →** sits top-left of the subject, **QUESTION / Everything** bottom-right
of her, so the reveal reads as the thing between them. Each pair sets its first
line in the sans (Geist, black, uppercase) and its second in italic
[Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — loaded
through `next/font` and exposed as the `font-display` utility. Below `sm` the
grid collapses to one column and the halves stack. A centred "scroll down"
label anchors the bottom of the hero.

Note: `.glitch` sets `display: inline-block` inside `@layer components`, so
Tailwind display utilities (`block`, `flex`, …) still win over it — needed for
the stacked lines in the logo and headline.

**[GlitchNav.tsx](src/components/GlitchNav.tsx)** — fixed nav. Each label is a
`.glitch` element that renders two chromatic ghosts via `::before` / `::after`,
twitching rarely on a staggered delay and hard on hover/focus.
