import { create } from "zustand";
import deepDiff, { diff } from "deep-diff";
import { parseHtmlToArray } from "@/utils/parseHtmlToArray";
import generateUniqueId from "@/utils/generateUniqueId";
import replaceSubstring from "@/utils/replaceSubstring";
import { refineForeign } from "@/utils/ai/refineForeign";

interface ErrorDetail {
  code: number;
  origin_word: string;
  refine_word: string[];
  index: number;
}

interface ErrorData {
  target_id: string;
  error: ErrorDetail[];
}

interface Errors extends ErrorData {
  error_id: string;
}

interface RefineState {
  preDocument: string[];
  initDocument: (newDocument: string) => void;
  updateDocument: (documentContext: string, editorRef) => void;
  onProcessing: boolean;
  errors: Errors[];
  appendErrors: (newErrors: ErrorData[]) => void;
  choiceError: string;
  setChoiceError: (error_id: string) => void;
}

const allowedHtmlTags = [
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
];

export class DocumentProcessor {
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
    newDocument = newDocument.map((element) => element.replace(/[\u200B-\u200D\uFEFF]/g, ""));

    // 비어있는 태그 제거
    newDocument = newDocument.filter((element) => {
      const tag = element.replace(/<(\w+)[^>]*>.*<\/\1>|<(\w+)[^>]*\/>/g, "$1$2").trim();
      return !tag || !["", "br"].includes(tag);
    });

    // 허용된 HTML 태그만 남김
    newDocument = newDocument.filter((element) => {
      const tag = element.replace(/<(\w+)[^>]*>.*<\/\1>|<(\w+)[^>]*\/>/g, "$1$2").trim();
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

  public async getAiRefinements(modifiedElements: string[]): Promise<ErrorData[]> {
    return import.meta.env.VITE_USE_MOCK_API === "true"
      ? this.fetchAiRefinementsMock(modifiedElements)
      : this.fetchAiRefinements(modifiedElements);
  }
  public async *fetchAiRefinementsLocal(modifiedElements: string[]): AsyncGenerator<ErrorData> {
    const generator = refineForeign(modifiedElements);

    for await (const element of generator) {
      console.log(element);

      yield element;
    }
  }
  private async fetchAiRefinements(modifiedElements: string[]): Promise<ErrorData[]> {
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
  private async fetchAiRefinementsMock(modifiedElements: string[]): Promise<ErrorData[]> {
    //use domparser
    const parser = new DOMParser();
    const document = parser.parseFromString(modifiedElements.join(""), "text/html");
    const errorData: ErrorData[] = [];
    const elements = document.querySelectorAll("[data-unique]");
    elements.forEach((element) => {
      const target_id = element.getAttribute("data-unique") || "";
      const error: ErrorDetail[] = [
        {
          code: 0,
          origin_word: element.textContent?.split(" ")[0] || "",
          refine_word: ["자료", "정보"],
          index: 0,
        },
      ];
      errorData.push({ target_id, error });
    });
    return errorData;
  }
}

export const useDocument = create<RefineState>((set) => {
  const documentProcessor = new DocumentProcessor();

  return {
    onProcessing: false,
    preDocument: [],
    initDocument: (newDocument: string) => set({ preDocument: parseHtmlToArray(newDocument) }),
    updateDocument: (documentContext: string, editorRef) =>
      set((state) => {
        if (state.onProcessing) return state;

        // Start processing
        set({ onProcessing: true });

        const newDocument = documentProcessor.processHtmlDocument(documentContext);

        // Find differences between previous and new document
        const differences = deepDiff.diff(state.preDocument, newDocument);

        // Exit early if no differences
        if (!differences || differences.length === 0) {
          set({ onProcessing: false });
          return state;
        }

        console.log(state.preDocument, "preDocument");
        console.log(newDocument, "newDocument");

        console.log(differences, "differences");
        // Extract modified elements
        const modifiedElements = documentProcessor.extractModifiedElements(
          differences,
          newDocument
        );

        // Process the document and update state
        const processRefinements = async () => {
          for await (const data of documentProcessor.fetchAiRefinementsLocal(modifiedElements)) {
            try {
              // Update UI with results
              state.appendErrors([data]);
              const processedDocument = await ErrorToBinding([data]);
              editorRef.current.setData(
                processedDocument.querySelector(".ck-content")?.innerHTML as string
              );

              // Update the state with the new document
              set({ preDocument: newDocument, onProcessing: false });
            } catch (e) {
              console.error("Error:", e);
              set({ onProcessing: false });
            }
          }
        };

        processRefinements();

        return { ...state, preDocument: newDocument };
      }),
    errors: [],
    appendErrors: (newErrors: ErrorData[]) =>
      set((state) => ({
        errors: [
          ...state.errors,
          ...newErrors.map((value) => ({ ...value, error_id: generateUniqueId("error-") })),
        ],
      })),
    choiceError: "",
    setChoiceError: (error_id: string) => set({ choiceError: error_id }),
  };
});

async function ErrorToBinding(data: ErrorData[]): Promise<Document> {
  const clonedDocument = document.cloneNode(true) as Document;

  await Promise.all(
    data.map(async (errorData) => {
      const { target_id, error: errors } = errorData;
      const targetElement = clonedDocument.querySelector(`[data-unique="${target_id}"]`);

      if (!targetElement) return null;

      return processErrorsInElement(targetElement, errors);
    })
  );

  return clonedDocument;
}

function processErrorsInElement(element: Element, errors: ErrorDetail[]): Element {
  let currentHTML = element.innerHTML;

  // Sort errors by index to process them in order
  const sortedErrors = [...errors].sort((a, b) => a.index - b.index);

  let additionalIndex = 0;

  for (const errorDetail of sortedErrors) {
    const { origin_word, index } = errorDetail;
    const adjustedIndex = index + additionalIndex;

    if (isWordAtIndex(currentHTML, origin_word, adjustedIndex)) {
      const errorId = generateUniqueId("error-");
      const wrappedWord = createErrorSpan(errorId, origin_word);

      currentHTML = replaceSubstring(
        currentHTML,
        adjustedIndex,
        adjustedIndex + origin_word.length,
        wrappedWord
      );

      // Update offset for next replacements
      additionalIndex += wrappedWord.length - origin_word.length;
    }
  }

  element.innerHTML = currentHTML;
  return element;
}

function isWordAtIndex(text: string, word: string, index: number): boolean {
  return text.slice(index, index + word.length) === word;
}

function createErrorSpan(id: string, text: string): string {
  return `<span id="${id}" class="__origin_word__">${text}</span>`;
}
