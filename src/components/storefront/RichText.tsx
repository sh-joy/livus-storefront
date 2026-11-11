import type { ReactNode } from 'react';

/**
 * A line that starts with a short label ending in ":" gets the label in bold,
 * e.g. "Styling Tips:", "Care Instructions:", "Fabric: Cotton mixed".
 * Lines that already use **bold** are left as written.
 */
function autoBoldLabel(line: string): string {
  if (line.includes('**')) return line;
  const m = line.match(/^(\s*)([A-Z][A-Za-z0-9 &/()'’.-]{1,40}):(\s|$)/);
  if (!m) return line;
  return `${m[1]}**${m[2]}:**${line.slice(m[0].length - m[3].length)}`;
}

/** Render **bold** spans inside one line of text. */
function inline(rawLine: string): ReactNode[] {
  const line = autoBoldLabel(rawLine);
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-[#0d0d0d]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

/**
 * Text written in the admin editors (product description, shipping text).
 * Supports **bold**, "- " bullet lines and blank lines between paragraphs.
 * Product description and shipping text share this, so they always look the same.
 */
export function RichText({ text }: { text: string }) {
  if (!text?.trim()) return null;
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-[1.6] text-[#3a3a3a]">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim());
        if (lines.length > 0 && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={bi} className="m-0 pl-5 list-disc flex flex-col gap-1">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        // Section heading: line wrapped entirely in **...**
        const headingMatch = lines.length > 0 && lines[0].trim().match(/^\*\*([^*]+)\*\*$/);
        if (headingMatch) {
          const headingText = headingMatch[1];
          const remainingLines = lines.slice(1);
          return (
            <div key={bi} className="flex flex-col gap-2 pt-3">
              <h2 className="text-[18px] md:text-[19px] font-semibold text-[#0d0d0d] m-0 tracking-tight leading-snug">
                {headingText}
              </h2>
              {remainingLines.length > 0 && (
                <p className="m-0">
                  {remainingLines.map((l, li) => (
                    <span key={li}>
                      {li > 0 && <br />}
                      {inline(l)}
                    </span>
                  ))}
                </p>
              )}
            </div>
          );
        }

        return (
          <p key={bi} className="m-0">
            {lines.map((l, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
