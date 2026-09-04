import type { ArticleStatus } from "@/lib/articles/types";
import { STATUS_HUE, STATUS_LABEL } from "@/lib/articles/types";

/** Where a piece sits in the pipeline, as a coloured chip. */
export default function StatusPill({
  status,
  className,
}: {
  status: ArticleStatus;
  className?: string;
}) {
  const hue = STATUS_HUE[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 font-arial text-[9px] font-bold tracking-[0.18em] uppercase ${className ?? ""}`}
      style={{ color: hue }}
    >
      <span aria-hidden className="size-2 shrink-0" style={{ backgroundColor: hue }} />
      {STATUS_LABEL[status]}
    </span>
  );
}
