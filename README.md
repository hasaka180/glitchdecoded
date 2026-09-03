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

The hero ([src/components/Hero.tsx](src/components/Hero.tsx)) is `100lvh` —
the viewport with mobile browser chrome retracted, a little taller than `svh`
without overflowing the screen. It shows
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
- **Reduced motion** — `prefers-reduced-motion` keeps the scan but slows it to
  a drift (0.35× speed, 0.7× amplitude) and drops the tear bursts, the debris
  and every CSS keyframe. It deliberately does not freeze: with the scan gated
  off entirely the hero sat dead until something was touched, which reads as a
  broken page rather than a calm one.

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

### Editor's note

The second section ([EditorsNote.tsx](src/components/EditorsNote.tsx)) is a
scroll-driven stage on white stock, in three acts:

1. **Written.** As the section climbs from the hero, its three statement lines
   ink themselves in turn — Asthetic Pixel in red, large and centred on the
   page.
2. **Travelled.** Once the section pins, the statement scales down and moves
   into the left column.
3. **Arrived.** The animated shelter illustration and the Cormorant Garamond
   prose fade up in sequence, each block on its own slice of progress.

The stage is a `280vh` runway with a `100lvh` sticky child. Two progress values
drive everything: `approach` (0 when the section's top sits at the bottom of
the viewport, 1 when it reaches the top) writes the lines; `progress` (position
within the pinned runway) drives the travel and the arrivals. Scroll and resize
are read inside a `requestAnimationFrame` callback, never synchronously in an
effect body.

Both media-query hooks use `useSyncExternalStore` with a `false` server
snapshot. A lazy `matchMedia` initialiser in `useState` makes the first client
render disagree with the server HTML, and since `staged` changes the markup,
that surfaced as a hydration mismatch on phones.

The centring is expressed as a delta from the statement's resting layout: the
transform is cleared, the box measured, and the opening position derived as
`stageCentre − boxCentre` with a scale constrained on *both* axes — width alone
lets six lines of script run off the top and bottom. Because the hand is a
local OTF whose metrics land after first paint, the element is watched with a
`ResizeObserver` and re-measured on `document.fonts.ready`; measuring once on
mount leaves the centring visibly off.

The title flies in a character at a time: each glyph is its own span, dropped
half an em and rotated, settling as the sequence reaches it. Characters carry a
running index across all three lines so the wave reads continuously, with about
six in flight at once.

Two paths drive it. With a runway (desktop) the sequence is scrubbed off scroll
position, keyed to the title's own rectangle rather than the section's — keyed
to the section, the letters finished arriving while still below the fold. Below
`md` there is no runway, so the same transforms run as a CSS transition with a
per-character delay, started by an `IntersectionObserver`; the illustration and
then the prose follow on their own delays, so the order reads title →
illustration → prose either way. Under `prefers-reduced-motion` everything is
in place from the start.

The paper is generated, not shipped: `.paper` lays a `feTurbulence` tile over
`--paper`, so the grain costs nothing and tiles seamlessly via `stitchTiles`.

Two edits were made to `umbrella-animated.svg` so it could sit on white: its
beige backing plate is now `fill="none"`, and its internal grain overlay — a
full-box filtered rect at 0.24 multiply — was removed. That overlay read as
paper on beige but as a grey square on white. Re-exporting the asset brings
both back. It stays a plain `<img>`: the file carries its own CSS keyframes,
and the image optimiser would strip or rasterise them. It is the one element
that never fades in.

### Paper tear

[RipStage.tsx](src/components/RipStage.tsx) pins the editor's note over the
category rail and tears the sheet away from the right as you scroll, so the
rail is uncovered rather than scrolled to. The note plays out first — title,
travel, prose — then the rip runs from about 56% to 90% of the runway, with a
hold at either end.

The stage owns the scroll maths and hands the note a `drive` prop; the note
renders as a plain full-height panel in that mode instead of carrying its own
runway. The paper is clipped with a `clip-path` polygon whose edge is a seeded
vertical tear, and it starts past the right edge and ends past the left, so the
jitter never nicks the sheet before the rip begins or leaves a sliver at the
end. A drop-shadow on the clipped layer casts the torn edge onto what it is
uncovering.

Below `md` and under reduced motion there is no pinning: the note runs at its
natural height, [PaperTear.tsx](src/components/PaperTear.tsx) does a horizontal
version of the same tear, and the rail follows. A phone cannot hold the note's
stacked layout in one viewport, so pinning it would crop the copy.

`PaperTear` is the sheet ending in a torn edge and lifting away faster than the
page scrolls, leaving a few shreds hanging in the gap.

The edge is generated, not drawn — a seeded `mulberry32` walk, so server and
client produce the same path and hydration stays clean. Its shape is the whole
trick: torn paper is a near-horizontal line that is never quite horizontal,
with constant small jitter and the occasional deeper nick. A regular zig-zag,
or teeth of any real height, reads as mountains instead. A second path a few
units below, in a darker mix of the paper colour, gives the sheet thickness.

### Explore by perspective

[PerspectiveRail.tsx](src/components/PerspectiveRail.tsx) is a snap-scrolling
rail of six category cards on a graphite ground — four across at `lg`, the rest
reached by scrolling. While the stage is pinned, page scroll walks the rail
along: the last fifth of the runway maps to the rail's `scrollLeft`, so
scrolling down carries the carousel to the right. Setting `scrollLeft` rather
than transforming keeps it a real scroll container, so a swipe still works and
nothing has to be undone when the stage lets go; snap is off while driven, or
it would fight the scroll position. Off the stage — mobile, reduced motion —
it is an ordinary snap-scrolling rail with the arrow buttons nudging it by one
card width. Cards and controls are cut with `.pixel-corner`: stepped corners
via `clip-path`, so they read as low-res sprites.

`.pixel-corner-sm` exists because the step size has to shrink with the box: at
the card's 5px step a 36px button loses most of its edges, and with a border
on it the leftovers read as stray bars.

Card art comes from [scripts/generate-card-art.js](scripts/generate-card-art.js),
which writes six sprite strips into `public/assets/categories` with a
hand-rolled PNG encoder and a seeded PRNG — re-running gives the same art. Each
file is six 132x176 frames laid out horizontally, and `.card-sprite` steps
`background-position` through them, so the scenes animate with no canvas, no
video and no library: clouds drift, shafts shimmer, the spiral turns, the crowd
bobs.

Two details that matter there. The PRNG is re-seeded identically per frame, so
static parts of a scene hold still and only phase-driven parts move — otherwise
the grain boils. And the step timing is `steps(6, jump-none)`: the default
`step-end` would skip the first frame and stop short of the last, since six
frames need six stops across the range, not six jumps.

The frames are tiny on purpose: the cards draw them with `image-rendering:
pixelated`, so the upscale is what produces the blocks. Swap in photographs by
dropping files at the same paths — as a strip if you want them animated, or a
single frame with `.card-sprite` swapped for a plain cover background.

### Recommended for you

[RecommendedGrid.tsx](src/components/RecommendedGrid.tsx) closes the page after
the topic field, on the same graphite ground. The cards are black with a still
image and a fade over it — no coloured ground behind the copy; the pick's hue
only reaches its category label and its top rule. It is a server component;
nothing here needs state, and the hover work is CSS.

The grid is four columns at `lg`. The featured card takes `col-span-2
row-span-2`, which leaves exactly a 2x2 for the other four, so the block squares
off with no holes; at `sm` the featured card spans both columns and the rest
pair up; below that everything stacks. The featured card's image runs the whole
card with the copy sitting on the black end of the fade; the smaller cards give
theirs a fixed `aspect-[3/2]` band and put the copy on black underneath, so the
art is not reduced to a strip behind the text.

Images are one still per article in `public/assets/recommended`, named for the
slug, drawn with `background-size: cover` — so any aspect ratio works and
swapping in photographs is a matter of replacing the files. The current stills
are single frames cut out of the category sprite strips with `sips`, which is
why `CardImage` sets `image-rendering: pixelated`: they are 132x176 and upscale
about four times. Drop that line along with the pixel art.

Nothing here animates. The rail's `.card-sprite` stepping is deliberately not
reused — `cover` on a still needs none of the `600% auto` frame arithmetic that
class requires, and by this point in the page five looping scenes would be
noise.

Each card is a `.pixel-corner` — the stepped corners finally read as steps here,
with the light ground showing through the notches — and carries a top rule held
at `scale-x-[0.28]` in the pick's hue that runs the rest of the edge as the card
is picked up. No borders: `clip-path` cuts them into stray bars at the corners.

Two details of fit. The read time sits on the top row beside the category rather
than with the reason line — at a quarter of a 1200px grid a card is ~270px wide,
and "Because you read Friendship - 5 min" wraps there. And since the ground no
longer changes at the section break, the nav's broken signal bar marks it
instead, in ink rather than cyan.

### Note to self

[NoteRip.tsx](src/components/NoteRip.tsx) is the mirror of the rip that opened
the category rail. It pins the film archive over the note board and tears it
away to the right, so the archive is not a section you leave — it is the page
that gets scrapped to uncover the board underneath. Where the first rip holds
the sheet on the left and uncovers from the right, this one holds it on the
right and uncovers from the left: the `clip-path` polygon anchors on `100%`
instead of `0%`, the edge runs from past the left edge to past the right, the
drop-shadow casts the other way, and the shreds hang off the right of the edge
and drift left. A different `mulberry32` seed, so the page does not tear along
the same fibres twice.

[ScreeningRoom.tsx](src/components/ScreeningRoom.tsx) takes an `inStage` prop
for that role: it drops its section break, tightens the header rhythm, and caps
the tube at `46lvh` so the whole archive holds one viewport while pinned. It
also carries `.stock` — the editor's-note grain without its colour, so a ground
that brings its own can still be printed on paper. A flat panel does not read
as something you could tear.

Below `md` and under reduced motion there is no pinning: the archive runs at its
natural height, `PaperTear` does the horizontal version, and the board follows.
That tear runs the other way round from the first one, so `PaperTear` takes a
`sheet` colour alongside `ground` — graphite lifting off the board's paper
rather than paper lifting off graphite.

[NoteWall.tsx](src/components/NoteWall.tsx) is the board: six notes people wrote
to themselves on a rail that shows four at a time and turns on its own, on the
same stock as the editor's note, because this is the other end of the same
conversation.

The rail is four slots at `lg`, two at `sm`, one below. The moving track always
carries two laps of the ring, so a slot is a twelfth of it at any width and one
step is the same sum everywhere; stepping past the sixth card lands on an
identical card, and the position is reset with the transition switched off two
frames later, so nothing appears to move. Gutters are the cards’ own padding
rather than a flex gap — that arithmetic stops holding otherwise. Autoplay holds
while the reader is on the rail or writing, and under reduced motion the track
does not move at all: the same six cards become a snap-scrolling row, which is
why the slot has to be measured against the viewport in that mode instead.

Each note is written over a full-bleed band of the category art, off the same
six-frame strips the rail animates, with the category ground burning through it
and a fade darkening the bottom so the hand reads over whatever the art is
doing there. Art, accent and ground are fixed per slot rather than random: the
board has to render identically on the server and the client, and a note keeps
its face when another one is pinned ahead of it. The lift is a `drop-shadow` on
the slot, not a `box-shadow` on the card — `.pixel-corner` clips with
`clip-path`, and `clip-path` takes a box-shadow with it.

A note the reader pins is kept in their own browser and the copy says so. It is
read through `useSyncExternalStore` rather than state seeded in an effect: the
server has no store, so a lazy initialiser would make the first client render
disagree with the server HTML. The snapshot is cached against the raw string so
it stays referentially stable — re-parsing on every call would loop React
forever — and a failed write keeps the cache agreeing with what the store
actually holds, or the next read would throw the note away again. The composer
is fixed to the viewport rather than laid into the board: while the board is
pinned to the scroll position, a form that moved as it was typed into would be
unusable.

**[GlitchNav.tsx](src/components/GlitchNav.tsx)** — fixed nav. Each label is a
`.glitch` element that renders two chromatic ghosts via `::before` / `::after`,
twitching rarely on a staggered delay and hard on hover/focus.
