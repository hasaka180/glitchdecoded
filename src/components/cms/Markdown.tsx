import { marked, type Token, type Tokens } from "marked";
import { Fragment, type ReactNode } from "react";

/**
 * Renders article markdown as React elements.
 *
 * Deliberately never uses `dangerouslySetInnerHTML`. Submissions come from
 * anyone who signs up, so the usual "parse to an HTML string, then sanitise it"
 * route puts one regex between a contributor and a script tag. Building React
 * nodes instead makes injection structurally impossible: an `html` token is
 * dropped rather than cleaned, and text can only ever become text.
 *
 * The supported subset is the one an essay needs — headings, emphasis, links,
 * quotes, lists, code, rules, images, tables. Anything else degrades to its
 * own plain text rather than disappearing.
 */

/** Blocks anything that isn't a plain web or mail link — `javascript:` chiefly. */
function safeHref(href: string): string | undefined {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|#|\/)/i.test(trimmed)) return trimmed;
  return undefined;
}

function renderInline(tokens: Token[] | undefined, keyPrefix: string): ReactNode {
  if (!tokens) return null;

  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;

    switch (token.type) {
      case "text": {
        const t = token as Tokens.Text;
        // A text token carries nested tokens when it contains entities.
        return t.tokens ? (
          <Fragment key={key}>{renderInline(t.tokens, key)}</Fragment>
        ) : (
          <Fragment key={key}>{t.text}</Fragment>
        );
      }

      case "escape":
        return <Fragment key={key}>{(token as Tokens.Escape).text}</Fragment>;

      case "strong":
        return (
          <strong key={key} className="font-semibold">
            {renderInline((token as Tokens.Strong).tokens, key)}
          </strong>
        );

      case "em":
        return (
          <em key={key} className="italic">
            {renderInline((token as Tokens.Em).tokens, key)}
          </em>
        );

      case "del":
        return (
          <s key={key} className="opacity-60">
            {renderInline((token as Tokens.Del).tokens, key)}
          </s>
        );

      case "codespan":
        return (
          <code
            key={key}
            className="rounded-none bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em]"
          >
            {(token as Tokens.Codespan).text}
          </code>
        );

      case "br":
        return <br key={key} />;

      case "link": {
        const t = token as Tokens.Link;
        const href = safeHref(t.href);
        if (!href) {
          // Keep the words, drop the link. Silently removing the text would
          // leave a hole mid-sentence.
          return (
            <Fragment key={key}>{renderInline(t.tokens, key)}</Fragment>
          );
        }
        const external = /^https?:/i.test(href);
        return (
          <a
            key={key}
            href={href}
            className="underline decoration-[color:var(--cyan)] decoration-2 underline-offset-4 transition-colors hover:text-[color:var(--cyan)]"
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer nofollow" }
              : {})}
          >
            {renderInline(t.tokens, key)}
          </a>
        );
      }

      case "image": {
        const t = token as Tokens.Image;
        const src = safeHref(t.href);
        if (!src) return null;
        return (
          // Contributor images are arbitrary remote URLs, which next/image
          // would need every host configured for in advance.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={src}
            alt={t.text ?? ""}
            className="my-8 block w-full"
            loading="lazy"
          />
        );
      }

      // Raw HTML in a submission is dropped rather than sanitised.
      case "html":
        return null;

      default: {
        const raw = (token as { raw?: string }).raw;
        return raw ? <Fragment key={key}>{raw}</Fragment> : null;
      }
    }
  });
}

const HEADING_CLASS: Record<number, string> = {
  1: "mt-12 mb-4 font-display text-[32px] leading-[1.15] font-semibold sm:text-[40px]",
  2: "mt-12 mb-4 font-display text-[26px] leading-[1.2] font-semibold sm:text-[32px]",
  3: "mt-10 mb-3 font-display text-[21px] leading-[1.25] font-semibold sm:text-[25px]",
  4: "mt-8 mb-2 font-arial text-[12px] font-bold tracking-[0.18em] uppercase opacity-70",
  5: "mt-8 mb-2 font-arial text-[11px] font-bold tracking-[0.18em] uppercase opacity-60",
  6: "mt-8 mb-2 font-arial text-[11px] font-bold tracking-[0.18em] uppercase opacity-50",
};

function renderBlocks(tokens: Token[], keyPrefix: string): ReactNode {
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;

    switch (token.type) {
      case "space":
        return null;

      case "heading": {
        const t = token as Tokens.Heading;
        const depth = Math.min(Math.max(t.depth, 1), 6);
        const Tag = `h${depth}` as "h1";
        return (
          <Tag key={key} className={HEADING_CLASS[depth]}>
            {renderInline(t.tokens, key)}
          </Tag>
        );
      }

      case "paragraph":
        return (
          <p key={key} className="my-5 leading-[1.7]">
            {renderInline((token as Tokens.Paragraph).tokens, key)}
          </p>
        );

      case "blockquote":
        return (
          <blockquote
            key={key}
            className="my-8 border-l-2 border-[color:var(--cyan)] pl-6 font-display text-[20px] leading-[1.5] italic opacity-90 sm:text-[23px]"
          >
            {renderBlocks((token as Tokens.Blockquote).tokens, key)}
          </blockquote>
        );

      case "list": {
        const t = token as Tokens.List;
        const Tag = t.ordered ? "ol" : "ul";
        return (
          <Tag
            key={key}
            className={`my-6 space-y-2 pl-6 ${t.ordered ? "list-decimal" : "list-disc"} marker:opacity-40`}
            {...(t.ordered && typeof t.start === "number" && t.start !== 1
              ? { start: t.start }
              : {})}
          >
            {t.items.map((item, j) => (
              <li key={`${key}-${j}`} className="leading-[1.65] pl-1">
                {/* A "loose" list wraps each item in a paragraph; a tight one
                    does not, and re-wrapping it would double the spacing. */}
                {item.tokens.length && item.tokens[0].type === "text"
                  ? renderInline(
                      (item.tokens[0] as Tokens.Text).tokens ?? item.tokens,
                      `${key}-${j}`,
                    )
                  : renderBlocks(item.tokens, `${key}-${j}`)}
              </li>
            ))}
          </Tag>
        );
      }

      case "code":
        return (
          <pre
            key={key}
            className="my-8 overflow-x-auto bg-black/50 p-5 font-mono text-[13px] leading-[1.6]"
          >
            <code>{(token as Tokens.Code).text}</code>
          </pre>
        );

      case "hr":
        return (
          <hr key={key} className="my-12 border-0 border-t border-current/20" />
        );

      case "table": {
        const t = token as Tokens.Table;
        return (
          // Wide tables scroll inside their own box rather than pushing the
          // article body sideways.
          <div key={key} className="my-8 overflow-x-auto">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead>
                <tr>
                  {t.header.map((cell, j) => (
                    <th
                      key={`${key}-h-${j}`}
                      className="border-b border-current/25 py-2 pr-6 font-arial text-[10px] font-bold tracking-[0.16em] uppercase opacity-60"
                    >
                      {renderInline(cell.tokens, `${key}-h-${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, r) => (
                  <tr key={`${key}-r-${r}`}>
                    {row.map((cell, c) => (
                      <td
                        key={`${key}-r-${r}-${c}`}
                        className="border-b border-current/10 py-2 pr-6 align-top"
                      >
                        {renderInline(cell.tokens, `${key}-r-${r}-${c}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "html":
        return null;

      default:
        return (
          <p key={key} className="my-5 leading-[1.7]">
            {renderInline([token], key)}
          </p>
        );
    }
  });
}

export default function Markdown({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  // `gfm` for tables and strikethrough. No `breaks`: an essay's soft wraps
  // shouldn't become line breaks.
  const tokens = marked.lexer(source ?? "", { gfm: true });

  return (
    <div
      className={`font-garamond text-[18px] sm:text-[19px] ${className ?? ""}`}
    >
      {renderBlocks(tokens, "md")}
    </div>
  );
}
