import translateJosa from "./josa/translateJosa";

export default function getSurroundingWordsByOriginId(
  targetId: string,
  originId: string,
  refinedWord: string,
  considerJosa: boolean = true,
  count = 3
): {
  before: string[];
  after: string[];
  josaDetail?: {
    beforeJosa: string | null;
    afterJosa: string | null;
  };
} {
  const editor = document.querySelectorAll(".ck-content")[0];

  const p = editor.querySelector(`p[data-unique="${targetId}"]`);

  if (!p) return { before: [], after: [] };
  const clone = p.cloneNode(true) as Element;

  const span = clone.querySelector(`span[originid="${originId}"]`);
  if (!span) return { before: [], after: [] };

  const MARKER = "<<<>>>";
  span.replaceWith(MARKER);
  const textContent = clone.textContent;
  if (!textContent) return { before: [], after: [] };

  // 조사 찾기
  let beforeJosa: string | null = null;
  let afterJosa: string | null = null;

  if (considerJosa) {
    const markerIndex = textContent.indexOf(MARKER);
    if (markerIndex === -1) return { before: [], after: [] };

    const startIndex = markerIndex + MARKER.length;
    const nextSpaceIndex = textContent.substring(startIndex).indexOf(" ");

    if (nextSpaceIndex > -1) {
      beforeJosa = textContent
      .substring(startIndex, startIndex + nextSpaceIndex)
      .replace(/<[^>]*>/g, "");
    } else {
      beforeJosa = textContent.substring(startIndex).replace(/<[^>]*>/g, "");
    }
    if (beforeJosa === "") beforeJosa = null;
    if (beforeJosa) {
      afterJosa = translateJosa(refinedWord as string, beforeJosa);
    }
  }

  const tokens = textContent.replace(MARKER, ` ${MARKER} `).trim().split(/\s+/);
  const idx = tokens.indexOf(MARKER);
  if (idx < 0) return { before: [], after: [] };
  const after = tokens.slice(idx + 1, idx + 1 + count);

  if (considerJosa) {
    // If a josa was identified and it's the first token in the 'after' array, remove it.
    if (beforeJosa && after.length > 0 && after[0] === beforeJosa) {
      after.shift();
    } else {
      // If the next token isn't the identified josa, then our assumption was wrong.
      // Invalidate the josa findings.
      beforeJosa = null;
      afterJosa = null;
    }
  }

  return {
    before: tokens.slice(Math.max(0, idx - count), idx),
    after: after,
    josaDetail: {
      beforeJosa: beforeJosa,
      afterJosa: afterJosa,
    },
  };
}