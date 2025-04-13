import { refineForeign } from "@/utils/ai/refineForeign";
import generateUniqueId from "@/utils/generateUniqueId";
import { parseHtmlToArray } from "@/utils/parseHtmlToArray";
import deepDiff from "deep-diff";
import { ErrorsInParagraphData, ErrorDetail } from "../shared/stores/error";
import { allowedHtmlTags } from "../shared/stores/useDocument";

export class DocumentProcessor {
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

  public async getAiRefinements(modifiedElements: string[]): Promise<ErrorsInParagraphData[]> {
    return import.meta.env.VITE_USE_MOCK_API === "true"
      ? this.fetchAiRefinementsMock(modifiedElements)
      : this.fetchAiRefinements(modifiedElements);
  }
  public async *fetchAiRefinementsLocal(
    modifiedElements: string[]
  ): AsyncGenerator<ErrorsInParagraphData> {
    const generator = refineForeign(modifiedElements);

    for await (const element of generator) {
      console.log(element);

      const errorWithIds = element.errors.map((errorItem) => ({
        ...errorItem,
        error_id: generateUniqueId("error-"),
      }));

      yield {
        target_id: element.target_id,
        errors: errorWithIds,
      };
    }
  }
  private async fetchAiRefinements(modifiedElements: string[]): Promise<ErrorsInParagraphData[]> {
    const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/ai/refine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: '<p data-unique="e-0">http</p>',
        content: modifiedElements,
      }),
      mode: "cors",
    });

    return response.json();
  }
  private async fetchAiRefinementsMock(
    modifiedElements: string[]
  ): Promise<ErrorsInParagraphData[]> {
    //use domparser
    const parser = new DOMParser();
    const document = parser.parseFromString(modifiedElements.join(""), "text/html");
    const errorData: ErrorsInParagraphData[] = [];
    const elements = document.querySelectorAll("[data-unique]");
    elements.forEach((element) => {
      const target_id = element.getAttribute("data-unique") || "";
      const error: ErrorDetail[] = [
        {
          code: 0,
          origin_word: element.textContent?.split(" ")[0] || "",
          refine_word: ["자료", "정보"],
          index: 0,
          error_id: generateUniqueId("error-"),
        },
      ];
      errorData.push({ target_id, errors: error });
    });
    return errorData;
  }
}
