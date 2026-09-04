/**
 * A topic's 11x11 bitmap, drawn as SVG.
 *
 * Shared by the drifting field on the home page and the topic pages, so a
 * sprite is defined once and takes the topic's own colour wherever it lands.
 * No `useMemo` and no "use client": the runs are cheap and this renders on the
 * server everywhere except inside the field.
 */

/** Contiguous lit runs per row, so a sprite is a handful of rects, not 121. */
function runs(rows: string[]) {
  const out: { x: number; y: number; w: number }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === "#") {
        let w = 1;
        while (row[x + w] === "#") w++;
        out.push({ x, y, w });
        x += w;
      } else x++;
    }
  });
  return out;
}

export default function TopicSprite({
  rows,
  color,
  className = "size-11 sm:size-14",
}: {
  rows: string[];
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 11 11"
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      {runs(rows).map((r) => (
        <rect
          key={`${r.x}-${r.y}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={color}
        />
      ))}
    </svg>
  );
}
