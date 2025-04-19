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
  let afterJosa: string | null = null;
  let beforeJosa: string | null = null;

  if (considerJosa) {
    const markerIndex = textContent.indexOf(MARKER);
    if (markerIndex === -1) return { before: [], after: [] };

    const startIndex = markerIndex + MARKER.length;
    const nextSpaceIndex = textContent.substring(startIndex).indexOf(" ");

    if (nextSpaceIndex > -1) {
      afterJosa = textContent.substring(
        startIndex,
        startIndex + nextSpaceIndex
      );
    } else {
      afterJosa = textContent.substring(startIndex);
    }
    if (afterJosa === "") afterJosa = null;
    if (afterJosa) {
      beforeJosa = translateJosa(refinedWord as string, afterJosa);
    }
  }

  const tokens = textContent.replace(MARKER, ` ${MARKER} `).trim().split(/\s+/);
  const idx = tokens.indexOf(MARKER);
  if (idx < 0) return { before: [], after: [] };
  const after = tokens.slice(idx + 1, idx + 1 + count);

  if (considerJosa) {
    // 문장 뒤에 변경해야할 조사가 존재한다면 after에서 조사 원소를 삭제
    if (!!afterJosa && after[0] === afterJosa) {
      after.shift();
    }
  }

  return {
    before: tokens.slice(Math.max(0, idx - count), idx),
    after: after,
    josaDetail: {
      beforeJosa: afterJosa,
      afterJosa: beforeJosa,
    },
  };
}