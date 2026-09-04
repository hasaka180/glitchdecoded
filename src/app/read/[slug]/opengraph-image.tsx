import { ImageResponse } from "next/og";

import { getPublishedBySlug } from "@/lib/articles/queries";
import { categoryHue, categoryName } from "@/lib/categories";

/**
 * The social preview card for a published piece.
 *
 * Rendered rather than uploaded, so a retitled piece never keeps a stale image.
 * The site's own faces aren't loaded here: `ImageResponse` needs each font as a
 * buffer, and a system stack keeps this cheap enough to generate on demand.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A Glitch in the Matrix";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedBySlug(slug);

  const title = article?.title ?? "A Glitch in the Matrix";
  const hue = article ? categoryHue(article.category) : "#4de2ff";
  const category = article ? categoryName(article.category) : "Decoded";
  const author = article?.authorName ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07070c",
          color: "#f4f4f5",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 22, height: 22, background: hue }} />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: hue,
              fontFamily: "monospace",
            }}
          >
            {category}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 60 : 76,
            lineHeight: 1.1,
            fontWeight: 600,
            // Long titles wrap rather than overflow the card.
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "monospace",
            opacity: 0.6,
          }}
        >
          <div style={{ display: "flex" }}>{author}</div>
          <div style={{ display: "flex" }}>A Glitch in the Matrix</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 10,
            background: hue,
          }}
        />
      </div>
    ),
    size,
  );
}
