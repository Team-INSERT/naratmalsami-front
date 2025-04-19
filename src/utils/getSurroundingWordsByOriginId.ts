export default function getSurroundingWordsByOriginId(targetId : string, originId : string, count = 3) {
  const editor = document.querySelectorAll(".ck-content")[0];

  const p = editor.querySelector(`p[data-unique="${targetId}"]`);

  if (!p) return { before: [], after: [] };
  const clone = p.cloneNode(true) as Element;

  const span = clone.querySelector(`span[originid="${originId}"]`);
  if (!span) return { before: [], after: [] };

  const MARKER = '<<<>>>';
  span.replaceWith(MARKER);
  const textContent = clone.textContent;
  if (!textContent) return { before: [], after: [] };

  const tokens = textContent.replace(MARKER, ` ${MARKER} `).trim().split(/\s+/);
  const idx = tokens.indexOf(MARKER);
  if (idx < 0) return { before: [], after: [] };

  return {
    before: tokens.slice(Math.max(0, idx - count), idx),
    after: tokens.slice(idx + 1, idx + 1 + count),
  };
}