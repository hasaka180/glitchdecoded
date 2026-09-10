"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { useNarrow } from "@/lib/useNarrow";

type Props = {
  /** Photo to fracture. Falls back to a procedural neon scene. */
  src?: string;
  /** Same picture as WebP, offered ahead of `src` where it is supported. */
  webpSrc?: string;
  /** Base grid unit in CSS px — modules are multiples of this. */
  unit?: number;
  /** Spotlight radius in CSS px. */
  radius?: number;
  /** Point of the photo to keep in frame, 0-1 (subject's face by default). */
  focus?: [number, number];
  /** Where that point lands on screen, 0-1. */
  anchor?: [number, number];
  /** Extra zoom over cover-fit, so there is room to pan. */
  zoom?: number;
  /** Narrow-viewport art, with its own framing. Falls back to the wide one. */
  mobileSrc?: string;
  mobileWebpSrc?: string;
  mobileFocus?: [number, number];
  mobileAnchor?: [number, number];
  mobileZoom?: number;
  /** Width at or below which the mobile art is used. */
  mobileMaxWidth?: number;
  className?: string;
};

const IDLE_AFTER = 1200; // ms of stillness before the hero drives itself

/**
 * Module shapes, in grid units, with weights. Small squares dominate; the
 * larger slabs are what give the fracture its irregular, chunky silhouette.
 */
const SHAPES: [number, number, number][] = [
  [1, 1, 7],
  [2, 1, 4],
  [1, 2, 4],
  [2, 2, 5],
  [3, 1, 2],
  [1, 3, 2],
  [3, 2, 3],
  [2, 3, 2],
  [4, 2, 1.5],
  [2, 4, 1.2],
  [3, 3, 1.5],
  [4, 4, 0.8],
  [6, 2, 0.6],
  [2, 6, 0.5],
  [5, 3, 0.6],
];
const SHAPE_TOTAL = SHAPES.reduce((s, [, , wgt]) => s + wgt, 0);

/**
 * How a block refracts what is behind it. The mix is what makes the reveal
 * read as broken glass rather than a photo crop: mirrored shards, frosted
 * panes and lens-magnified panels sitting alongside clear ones.
 */
type Material = "clear" | "mirror" | "frost" | "lens";

type Module = {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  material: Material;
  /** Stable sampling offset — this block shows a slice of somewhere else. */
  ox: number;
  oy: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Fractures a photo under the pointer. The image is the base layer; irregular
 * modular panes under the spotlight re-sample it — mirrored, frosted,
 * magnified or laterally refracted — so the picture breaks into glass where
 * you look, then heals as the heat decays. When the pointer goes quiet the
 * spotlight keeps scanning on its own.
 */
export default function PixelUnglitch({
  src,
  webpSrc,
  unit = 18,
  radius = 255,
  focus = [0.48, 0.3],
  anchor = [0.56, 0.42],
  zoom = 1.08,
  mobileSrc,
  mobileWebpSrc,
  mobileFocus,
  mobileAnchor,
  mobileZoom,
  mobileMaxWidth = 640,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // The canvas stays invisible until it has actually drawn a frame, so the
  // handoff from the plain <img> underneath is a crossfade rather than a
  // flash of the opaque black the context is cleared to.
  const [shown, setShown] = useState(false);

  const narrow = useNarrow(mobileMaxWidth);
  const useMobile = narrow && !!mobileSrc;
  const activeSrc = useMobile ? mobileSrc : src;
  const activeFocus = (useMobile && mobileFocus) || focus;
  const activeAnchor = (useMobile && mobileAnchor) || anchor;
  const activeZoom = (useMobile && mobileZoom) || zoom;
  // destructured so the dependency array stays statically checkable
  const [focusX, focusY] = activeFocus;
  const [anchorX, anchorY] = activeAnchor;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // touch devices have no hovering pointer to wait for, so the scan just
    // runs — wider and quicker, since it is the only motion on offer
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    // --- scene buffer (what lives under the red plate) ----------------------
    const scene = document.createElement("canvas");
    const sctx = scene.getContext("2d")!;

    // tiny buffer used to fake a blur for frosted panes
    const BLUR = 10;
    const blur = document.createElement("canvas");
    blur.width = BLUR;
    blur.height = BLUR;
    const blurCtx = blur.getContext("2d")!;
    let photo: HTMLImageElement | null = null;

    let w = 0;
    let h = 0;
    // working values — scaled down on small viewports so the spotlight never
    // swallows the whole screen
    let U = unit;
    let R = radius;
    let modules: Module[] = [];
    let heat = new Float32Array(0);
    let shift = new Float32Array(0); // horizontal tear displacement, px

    // --- pointer state -----------------------------------------------------
    const target = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    const drift = { x: 0, y: 0 };
    let lastMove = -Infinity;
    let hasPointer = false;
    let nextBurst = 0;

    /** Neon-ish stand-in, used only when no photo is supplied. */
    const paintFallback = () => {
      const g = sctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#050615");
      g.addColorStop(0.5, "#0b1240");
      g.addColorStop(1, "#03040d");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, w, h);
      const blob = (x: number, y: number, r: number, color: string, a: number) => {
        const rg = sctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, color);
        rg.addColorStop(1, "transparent");
        sctx.globalAlpha = a;
        sctx.fillStyle = rg;
        sctx.fillRect(x - r, y - r, r * 2, r * 2);
        sctx.globalAlpha = 1;
      };
      blob(w * 0.3, h * 0.42, w * 0.34, "#1b2ac9", 0.85);
      blob(w * 0.68, h * 0.3, w * 0.26, "#ff2f7a", 0.5);
      blob(w * 0.52, h * 0.78, w * 0.3, "#4de2ff", 0.28);
      sctx.save();
      sctx.translate(w * 0.74, h * 0.45);
      sctx.rotate(-0.32);
      sctx.shadowColor = "#ff5fa2";
      sctx.shadowBlur = 60;
      sctx.fillStyle = "#ffd9ea";
      sctx.fillRect(-9, -h * 0.5, 18, h);
      sctx.restore();
    };

    const paintScene = () => {
      if (w === 0 || h === 0) return;
      if (photo && photo.naturalWidth > 0) {
        const iw = photo.naturalWidth;
        const ih = photo.naturalHeight;
        // cover-fit plus a little zoom, then panned so `focus` lands on `anchor`
        const scale = Math.max(w / iw, h / ih) * activeZoom;
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = Math.min(
          0,
          Math.max(w - dw, anchorX * w - focusX * dw),
        );
        const dy = Math.min(
          0,
          Math.max(h - dh, anchorY * h - focusY * dh),
        );
        sctx.fillStyle = "#05060f";
        sctx.fillRect(0, 0, w, h);
        sctx.drawImage(photo, dx, dy, dw, dh);
      } else {
        paintFallback();
      }
    };

    /**
     * Greedy random tiling: walk the grid and drop the largest randomly
     * chosen shape that still fits, so blocks interlock at irregular sizes.
     */
    const buildModules = () => {
      const cols = Math.ceil(w / U);
      const rows = Math.ceil(h / U);
      const taken = new Uint8Array(cols * rows);
      const next: Module[] = [];

      const fits = (cx: number, cy: number, mw: number, mh: number) => {
        if (cx + mw > cols || cy + mh > rows) return false;
        for (let y = cy; y < cy + mh; y++)
          for (let x = cx; x < cx + mw; x++) if (taken[y * cols + x]) return false;
        return true;
      };

      const pickShape = () => {
        let r = Math.random() * SHAPE_TOTAL;
        for (const [sw, sh, wgt] of SHAPES) {
          r -= wgt;
          if (r <= 0) return [sw, sh] as const;
        }
        return [1, 1] as const;
      };

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (taken[cy * cols + cx]) continue;
          let [mw, mh] = pickShape();
          while (!fits(cx, cy, mw, mh)) {
            if (mw > mh) mw--;
            else mh--;
            if (mw < 1 || mh < 1) {
              mw = 1;
              mh = 1;
              break;
            }
          }
          for (let y = cy; y < cy + mh; y++)
            for (let x = cx; x < cx + mw; x++) taken[y * cols + x] = 1;

          const seed = Math.random();
          const material: Material =
            seed < 0.17
              ? "mirror"
              : seed < 0.3
                ? "frost"
                : seed < 0.46
                  ? "lens"
                  : "clear";
          next.push({
            x: cx * U,
            y: cy * U,
            w: mw * U,
            h: mh * U,
            seed,
            material,
            // a few blocks pull their content from a neighbouring slice
            ox: seed > 0.8 && seed < 0.86 ? Math.round((seed - 0.83) * 90) * U : 0,
            oy: seed > 0.06 && seed < 0.1 ? Math.round((seed - 0.08) * 120) * U : 0,
          });
        }
      }

      modules = next;
      heat = new Float32Array(modules.length);
      shift = new Float32Array(modules.length);
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      U = Math.max(12, Math.min(unit, Math.round(w / 26)));
      R = Math.min(radius, w * (coarse ? 0.5 : 0.4), h * 0.5);

      scene.width = w;
      scene.height = h;
      paintScene();
      buildModules();

      if (smooth.x === 0 && smooth.y === 0) {
        smooth.x = target.x = w * 0.55;
        smooth.y = target.y = h * 0.45;
      }
    };

    // The photo is the <img> rendered below, not a second copy fetched here.
    // It used to be `new Image()` inside this effect, which meant the browser
    // could not learn the hero photo existed until the whole React bundle had
    // downloaded, parsed and hydrated — the request that decides LCP was the
    // last one the page made rather than the first. Rendered as markup it is
    // found by the preload scanner in the initial HTML, and drawing from that
    // same element costs no extra request and no extra decode.
    const img = imgRef.current;
    const adopt = () => {
      if (!img || !img.naturalWidth) return;
      photo = img;
      paintScene();
      buildModules();
    };
    if (img?.complete) adopt();
    img?.addEventListener("load", adopt);

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      lastMove = performance.now();
      hasPointer = true;
    };
    const onLeave = () => {
      hasPointer = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave);

    const ro = new ResizeObserver(resize);

    // iOS suspends rAF when the tab is backgrounded and restores pages from
    // the back/forward cache without re-running effects — re-measure and reset
    // the clock on the way back so the loop picks up cleanly.
    const onResume = () => {
      if (document.hidden) {
        stop();
        return;
      }
      last = performance.now();
      resize();
      if (visible) start();
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("pageshow", onResume);

    /** Rip a horizontal band open and slide it sideways. */
    const burst = (idle: boolean) => {
      // keep tears near the spotlight so they read as part of the cluster
      const y = smooth.y + (Math.random() - 0.5) * R * 2.4;
      const band = U * (1 + Math.random() * (idle ? 4 : 2));
      const x0 = smooth.x + (Math.random() - 0.5) * R * 2.2 - w * 0.1;
      const len = w * (0.15 + Math.random() * 0.4);
      const off = (Math.random() - 0.5) * U * (idle ? 8 : 5);
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        if (m.y + m.h < y || m.y > y + band) continue;
        if (m.x + m.w < x0 || m.x > x0 + len) continue;
        heat[i] = Math.max(heat[i], 0.6 + Math.random() * 0.4);
        shift[i] = off;
      }
    };

    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let revealed = false;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      frames++;
      if (frames % 5 === 0) {
        (window as unknown as { __glitch?: unknown }).__glitch = {
          frames,
          size: `${w}x${h}`,
          panes: modules.length,
          photo: !!photo,
          reduced,
          coarse,
        };
      }
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;

      // a first measure at zero size leaves no panes — re-measure until it takes
      if (modules.length === 0) {
        resize();
        return;
      }

      const idle = coarse || now - lastMove > IDLE_AFTER;

      if (idle) {
        // Reduce Motion keeps the scan — freezing it leaves the hero dead
        // until something is touched — but slows it right down and drops the
        // tears and debris below.
        const t = (now / 1000) * (reduced ? 0.35 : coarse ? 1.5 : 1);
        drift.x = lerp(drift.x, 0, 0.04 * dt);
        drift.y = lerp(drift.y, 0, 0.04 * dt);
        const amp = reduced ? 0.7 : coarse ? 1.5 : 1;
        target.x =
          w *
            (0.52 +
              0.24 * amp * Math.sin(t * 0.29) +
              0.08 * Math.sin(t * 0.77 + 1.2)) +
          drift.x;
        target.y =
          h *
            (0.4 +
              0.16 * amp * Math.cos(t * 0.23) +
              0.06 * Math.sin(t * 0.59 + 0.4)) +
          drift.y;
      }

      const ease = idle ? (reduced ? 0.025 : coarse ? 0.08 : 0.045) : 0.2;
      smooth.x = lerp(smooth.x, target.x, Math.min(1, ease * dt));
      smooth.y = lerp(smooth.y, target.y, Math.min(1, ease * dt));

      const decay = Math.pow(0.94, dt);
      const shiftDecay = Math.pow(0.86, dt);
      const active = hasPointer || idle;

      for (let i = 0; i < modules.length; i++) {
        heat[i] *= decay;
        shift[i] *= shiftDecay;
        if (!active) continue;

        const m = modules[i];
        // distance from the spotlight to the nearest point on the block
        const dx = Math.max(m.x - smooth.x, 0, smooth.x - (m.x + m.w));
        const dy = Math.max(m.y - smooth.y, 0, smooth.y - (m.y + m.h));
        const d = Math.sqrt(dx * dx + dy * dy) / R;

        if (d < 1) {
          const v = (1 - d * d) ** 1.25 * (0.72 + m.seed * 0.5);
          if (v > heat[i]) heat[i] = Math.min(1, v);
        } else if (
          !reduced &&
          d < 1.45 &&
          Math.random() < (coarse ? 0.002 : 0.005) * (1.45 - d)
        ) {
          // detached debris orbiting the cluster
          heat[i] = Math.max(heat[i], 0.55 + Math.random() * 0.45);
        }
      }

      if (!reduced && now > nextBurst) {
        nextBurst = coarse
          ? now + 900 + Math.random() * 1300
          : now + (idle ? 260 + Math.random() * 520 : 700 + Math.random() * 1400);
        const count = idle && !coarse ? 1 + ((Math.random() * 3) | 0) : 1;
        for (let k = 0; k < count; k++) burst(idle);
      }

      // --- draw --------------------------------------------------------------
      // the photo is the base layer; panes are drawn over it. WebKit throws on
      // degenerate drawImage arguments where Chrome shrugs, so one bad pane
      // must not take the whole loop down with it.
      if (scene.width < 1 || scene.height < 1) return;
      try {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(scene, 0, 0);

      for (let i = 0; i < modules.length; i++) {
        const v = heat[i];
        const m = modules[i];
        const cut = 0.16 + m.seed * 0.2;
        if (v < cut) continue;

        // two hard steps only, and the partial step is a thin fringe — the
        // reference is built from solid chunks, not translucent ones
        const full = v > cut + 0.07;
        const a = full ? 1 : 0.6;

        const sx = Math.max(0, Math.min(w - m.w, m.x + m.ox + shift[i]));
        const sy = Math.max(0, Math.min(h - m.h, m.y + m.oy));

        ctx.globalAlpha = a;
        switch (m.material) {
          case "mirror": {
            // reflected shard — the scene flipped inside the block
            ctx.save();
            ctx.translate(m.x + m.w, m.y);
            ctx.scale(-1, 1);
            ctx.drawImage(scene, sx, sy, m.w, m.h, 0, 0, m.w, m.h);
            ctx.restore();
            break;
          }
          case "frost": {
            // cheap blur: downsample into a tiny buffer, then scale it back up
            blurCtx.clearRect(0, 0, BLUR, BLUR);
            blurCtx.drawImage(scene, sx, sy, m.w, m.h, 0, 0, BLUR, BLUR);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(blur, 0, 0, BLUR, BLUR, m.x, m.y, m.w, m.h);
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(m.x, m.y, m.w, m.h);
            break;
          }
          case "lens": {
            // magnified pane — samples a smaller region across the same area
            const k = 1 / 1.35;
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(
              scene,
              sx + (m.w * (1 - k)) / 2,
              sy + (m.h * (1 - k)) / 2,
              m.w * k,
              m.h * k,
              m.x,
              m.y,
              m.w,
              m.h,
            );
            ctx.imageSmoothingEnabled = false;
            break;
          }
          default: {
            // clear pane — refracts laterally, so the picture steps sideways
            const k = 5 + m.seed * 12;
            ctx.drawImage(
              scene,
              Math.max(0, Math.min(w - m.w, sx + k)),
              sy,
              m.w,
              m.h,
              m.x,
              m.y,
              m.w,
              m.h,
            );
          }
        }

        // Travelling sheen: one light source raking across the whole cluster,
        // so the panes read as a single sheet of glass catching it.
        const sheen =
          0.5 + 0.5 * Math.sin((m.x + m.y * 0.65) / 240 - now * 0.0007);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a * (0.03 + 0.09 * sheen * sheen * sheen);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(m.x, m.y, m.w, m.h);
        ctx.globalCompositeOperation = "source-over";

        // Bevel — only some panes catch a lit edge, and only on one axis, so
        // the cluster reads as broken glass instead of a tiled wall.
        if (m.seed > 0.38) {
          ctx.globalAlpha = a * (0.3 + m.seed * 0.5);
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          if (m.seed > 0.66) ctx.fillRect(m.x, m.y, m.w, 1);
          else ctx.fillRect(m.x, m.y, 1, m.h);
        }
        if (m.seed < 0.5) {
          ctx.globalAlpha = a * (0.15 + m.seed * 0.5);
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          if (m.seed < 0.24) ctx.fillRect(m.x, m.y + m.h - 1, m.w, 1);
          else ctx.fillRect(m.x + m.w - 1, m.y, 1, m.h);
        }

        // Refracted fringe while a pane is still resolving.
        if (!full) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.22;
          ctx.drawImage(
            scene,
            Math.max(0, sx - 4),
            sy,
            m.w,
            m.h,
            m.x,
            m.y,
            m.w,
            m.h,
          );
          ctx.fillStyle = m.seed > 0.5 ? "#bfefff" : "#8ab4ff";
          ctx.globalAlpha = 0.12;
          ctx.fillRect(m.x, m.y, m.w, m.h);
          ctx.globalCompositeOperation = "source-over";
        }
      }
        ctx.globalAlpha = 1;

        // First good frame — fade the canvas up over the <img> it replaces.
        if (!revealed && (photo || !activeSrc)) {
          revealed = true;
          setShown(true);
        }
      } catch (err) {
        (window as unknown as { __glitch?: unknown }).__glitch = {
          drawError: String(err),
        };
      }
    };

    // Measuring, tiling the grid and painting the scene buffer is a few hundred
    // ms of main thread on a mid-range phone. None of it is on the path to
    // what the reader sees — the <img> underneath is already showing the photo
    // — so it waits for the browser to go idle rather than competing with
    // hydration, and it stops entirely whenever the hero scrolls away.
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    let visible = false;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: "200px" },
    );

    const activate = () => {
      ro.observe(wrap); // its first callback is what measures and tiles
      io.observe(wrap);
    };
    const canIdle = typeof window.requestIdleCallback === "function";
    const idleId = canIdle
      ? window.requestIdleCallback(activate, { timeout: 2000 })
      : window.setTimeout(activate, 200);

    return () => {
      if (canIdle) window.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
      stop();
      io.disconnect();
      img?.removeEventListener("load", adopt);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("pageshow", onResume);
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [activeSrc, unit, radius, activeZoom, focusX, focusY, anchorX, anchorY]);

  // Framing for the plain <img>, as custom properties so the narrow art can be
  // reframed in CSS at the same breakpoint <source> switches on. `object-fit:
  // cover` already sizes it; these only decide which part survives the crop.
  const artStyle = {
    "--art-pos": `${focus[0] * 100}% ${focus[1] * 100}%`,
    "--art-zoom": zoom,
    "--art-pos-narrow": `${(mobileFocus ?? focus)[0] * 100}% ${(mobileFocus ?? focus)[1] * 100}%`,
    "--art-zoom-narrow": mobileZoom ?? zoom,
  } as CSSProperties;

  return (
    <div ref={wrapRef} className={className}>
      {/* The photo, as markup rather than as something JavaScript goes and
          fetches once it has hydrated. This is the LCP element: the preload
          scanner finds it while the HTML is still streaming, so it is in
          flight before a byte of the React bundle has run. The canvas above
          draws from this very element once it is ready. */}
      {src ? (
        <picture>
          {/* Order matters: the browser takes the first <source> that both
              matches and it can decode, so the narrow art comes before the
              wide one and WebP before the JPEG within each. */}
          {mobileWebpSrc ? (
            <source
              media={`(max-width: ${mobileMaxWidth}px)`}
              type="image/webp"
              srcSet={mobileWebpSrc}
            />
          ) : null}
          {mobileSrc ? (
            <source
              media={`(max-width: ${mobileMaxWidth}px)`}
              srcSet={mobileSrc}
            />
          ) : null}
          {webpSrc ? <source type="image/webp" srcSet={webpSrc} /> : null}
          <img
            ref={imgRef}
            src={src}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            style={artStyle}
            className="hero-art absolute inset-0 block size-full object-cover"
          />
        </picture>
      ) : null}

      <canvas
        ref={canvasRef}
        className={`relative block h-full w-full transition-opacity duration-700 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
