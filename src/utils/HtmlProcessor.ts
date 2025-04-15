import { parseHtmlToArray } from "@/utils/parseHtmlToArray";
import deepDiff from "deep-diff";

export const allowedHtmlTags = [
  // 기본 텍스트 태그
  "p",
  "span",
  // "br",
  "hr",

  // 제목 태그
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",

  // 강조 및 스타일 태그
  "b",
  "strong",
  "i",
  "em",
  "u",
  "mark",
  "small",
  "del",
  "ins",
  "sub",
  "sup",

  // 인용 및 코드 관련 태그
  "blockquote",
  "q",
  "cite",
  "code",
  "pre",
  "kbd",
  "samp",
  "var",

  // 목록 관련 태그
  "li",
  "dt",
  "dd",

  // 테이블 관련 태그
  "th",
  "td",
  "caption",
  "tbody",
  "thead",
  "tfoot",
];

export class HtmlProcessor {
  static prepareDiff(preDocument: string[]): string[] {
    return preDocument.map((element) => {
      // HTML 태그를 제거하고
      return element.replace(/<[^>]*>/g, "").trim();
    });
  }
  public processHtmlDocument(documentContext: string): string[] {
    return this.filterInvalidElements(parseHtmlToArray(documentContext));
  }

  private filterInvalidElements(newDocument: string[]) {
    // &nbsp;가 포함된 요소는 제거
    newDocument = newDocument.filter((element) => !element.includes("&nbsp;"));

    // <!-- 주석 -->가 포함된 요소는 제거
    newDocument = newDocument.filter((element) => !element.includes("<!--"));

    // 빈 요소는 제거
    newDocument = newDocument.filter((element) => element.trim() !== "");

    // 보이지 않는 문자 제거
    newDocument = newDocument.map((element) => element.replace(/[\t\r\u200B-\u200D\uFEFF]/g, ""));

    // 공백만 포함된 태그 제거
    newDocument = newDocument.filter((element) => {
      const content = element.replace(/<[^>]*>/g, "").trim();
      return content !== "";
    });

    // 비어있는 태그 제거
    newDocument = newDocument.filter((element) => {
      const tag = element.replace(/<\/?(\w+)[^>]*>/g, "$1").trim();
      return !["", "br"].includes(tag);
    });

    // 허용된 HTML 태그만 남김
    newDocument = newDocument.filter((element) => {
      const tagMatch = element.match(/<\/?(\w+)[^>]*>/);
      const tag = tagMatch ? tagMatch[1] : "";
      return allowedHtmlTags.includes(tag);
    });

    return newDocument;
  }

  public extractModifiedElements(
    differences: deepDiff.Diff<string[]>[],
    newDocument: string[]
  ): string[] {
    enum DiffKind {
      Edit = "E",
      New = "N",
      Array = "A",
    }

    // 변경된 요소의 인덱스를 찾음
    const modifiedOrAddedIndices = differences
      .map((diff) => {
        if ((diff.kind === DiffKind.Edit || diff.kind === DiffKind.New) && diff.path) {
          return diff.path[0];
        }
        if (diff.kind === DiffKind.Array) {
          return diff.index;
        }
        return undefined;
      })
      .filter((index): index is number => index !== undefined);

    // 중복된 인덱스를 제거
    const uniqueIndices = [...new Set(modifiedOrAddedIndices)];

    // 변경된 요소를 추출
    return uniqueIndices.map((index) => newDocument[index]);
  }
}
