"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Photo revealed under the red plate. Falls back to a procedural neon scene. */
  src?: string;
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
  className?: string;
};

const RED = "#ec1b2e";
const IDLE_AFTER = 1200; // ms of stillness before the hero drives itself

/**
 * Module shapes, in grid units, with weights. Small squares dominate; the
 * larger slabs are what give the reveal its irregular, chunky silhouette.
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

type Module = {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  /** Render as one flat colour chunk instead of photo content. */
  flat: boolean;
  color: string;
  /** Stable sampling offset — this block shows a slice of somewhere else. */
  ox: number;
  oy: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Paints a red plate over a photo and "unglitches" it: irregular modular
 * blocks under the spotlight snap through to the image beneath, with
 * chromatic smear, flat posterised chunks, detached debris and tear bursts.
 * When the pointer goes quiet the spotlight keeps scanning on its own.
 */
export default function PixelUnglitch({
  src,
  unit = 18,
  radius = 255,
  focus = [0.48, 0.3],
  anchor = [0.56, 0.42],
  zoom = 1.08,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- scene buffer (what lives under the red plate) ----------------------
    const scene = document.createElement("canvas");
    const sctx = scene.getContext("2d", { willReadFrequently: true })!;
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
        const scale = Math.max(w / iw, h / ih) * zoom;
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = Math.min(0, Math.max(w - dw, anchor[0] * w - focus[0] * dw));
        const dy = Math.min(0, Math.max(h - dh, anchor[1] * h - focus[1] * dh));
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
          next.push({
            x: cx * U,
            y: cy * U,
            w: mw * U,
            h: mh * U,
            seed,
            flat: seed > 0.88,
            color: RED,
            // a few blocks pull their content from a neighbouring slice
            ox: seed > 0.8 && seed < 0.86 ? Math.round((seed - 0.83) * 90) * U : 0,
            oy: seed > 0.06 && seed < 0.1 ? Math.round((seed - 0.08) * 120) * U : 0,
          });
        }
      }

      // Sample the scene so flat chunks are posterised from real content.
      if (w > 0 && h > 0) {
        const data = sctx.getImageData(0, 0, w, h).data;
        for (const m of next) {
          let r = 0;
          let g = 0;
          let b = 0;
          let n = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const px = Math.min(w - 1, Math.round(m.x + ((sx + 0.5) / 3) * m.w));
              const py = Math.min(h - 1, Math.round(m.y + ((sy + 0.5) / 3) * m.h));
              const i = (py * w + px) * 4;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              n++;
            }
          }
          // push the average toward ink/navy so flats read as data blocks
          const k = 0.55;
          m.color = `rgb(${Math.round((r / n) * k)},${Math.round((g / n) * k)},${Math.round(
            (b / n) * k + 12,
          )})`;
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
      R = Math.min(radius, w * 0.4, h * 0.5);

      scene.width = w;
      scene.height = h;
      paintScene();
      buildModules();

      if (smooth.x === 0 && smooth.y === 0) {
        smooth.x = target.x = w * 0.55;
        smooth.y = target.y = h * 0.45;
      }
    };

    if (src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        photo = img;
        paintScene();
        buildModules();
      };
      img.src = src;
    }

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
    ro.observe(wrap);
    resize();

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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;

      const idle = !reduced && now - lastMove > IDLE_AFTER;

      if (idle) {
        const t = now / 1000;
        drift.x = lerp(drift.x, 0, 0.04 * dt);
        drift.y = lerp(drift.y, 0, 0.04 * dt);
        target.x =
          w * (0.56 + 0.24 * Math.sin(t * 0.29) + 0.08 * Math.sin(t * 0.77 + 1.2)) +
          drift.x;
        target.y =
          h * (0.36 + 0.12 * Math.cos(t * 0.23) + 0.06 * Math.sin(t * 0.59 + 0.4)) +
          drift.y;
      }

      const ease = idle ? 0.045 : 0.2;
      smooth.x = lerp(smooth.x, target.x, Math.min(1, ease * dt));
      smooth.y = lerp(smooth.y, target.y, Math.min(1, ease * dt));

      const decay = Math.pow(0.94, dt);
      const shiftDecay = Math.pow(0.86, dt);
      const active = hasPointer || idle || reduced;

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
        } else if (!reduced && d < 1.45 && Math.random() < 0.005 * (1.45 - d)) {
          // detached debris orbiting the cluster
          heat[i] = Math.max(heat[i], 0.55 + Math.random() * 0.45);
        }
      }

      if (!reduced && now > nextBurst) {
        nextBurst = now + (idle ? 260 + Math.random() * 520 : 700 + Math.random() * 1400);
        const count = idle ? 1 + ((Math.random() * 3) | 0) : 1;
        for (let k = 0; k < count; k++) burst(idle);
      }

      // --- draw --------------------------------------------------------------
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, w, h);

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
        if (m.flat) {
          ctx.fillStyle = m.color;
          ctx.fillRect(m.x, m.y, m.w, m.h);
        } else {
          ctx.drawImage(scene, sx, sy, m.w, m.h, m.x, m.y, m.w, m.h);
        }

        // chromatic smear while a block is still resolving
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
          ctx.fillStyle = m.seed > 0.5 ? "#4de2ff" : "#1b2ac9";
          ctx.globalAlpha = 0.1;
          ctx.fillRect(m.x, m.y, m.w, m.h);
          ctx.globalCompositeOperation = "source-over";
        }
      }
      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, unit, radius, zoom, focus[0], focus[1], anchor[0], anchor[1]]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
