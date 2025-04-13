import { create } from "zustand";
import deepDiff from "deep-diff";
import { parseHtmlToArray } from "@/utils/parseHtmlToArray";
import generateUniqueId from "@/utils/generateUniqueId";
import replaceSubstring from "@/utils/replaceSubstring";
import { ErrorsInParagraph, ErrorDetail, RefineState } from "./error";
import { DocumentProcessor } from "../../utils/DocumentProcessor";

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
];

export const useDocument = create<RefineState>((set) => {
  const documentProcessor = new DocumentProcessor();

  return {
    onProcessing: false,
    preDocument: [],
    editorRef: null,
    initDocument: (editorRef) => set({ editorRef }),
    replaceWord: (error: ErrorDetail) =>
      set((state) => {
        const clonedDocument = document.cloneNode(true) as Document;

        const targetElement = clonedDocument.querySelector(`#${error.error_id}`);

        if (targetElement) {
          targetElement.innerHTML = error.refine_word[0];
        }

        state.editorRef.current.setData(
          clonedDocument.querySelector(".ck-content")?.innerHTML as string
        );

        state.preDocument = documentProcessor.processHtmlDocument(
          clonedDocument.querySelector(".ck-editor__editable")?.innerHTML as string
        );

        return state;
      }),
    updateDocument: (documentContext: string) =>
      set((state) => {
        if (state.onProcessing) return state;

        // Start processing
        set({ onProcessing: true });

        const newDocument = documentProcessor.processHtmlDocument(documentContext);

        // Find differences between previous and new document
        const differences = deepDiff.diff(
          DocumentProcessor.prepareDiff(state.preDocument),
          DocumentProcessor.prepareDiff(newDocument)
        );

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
            const errorsInParagraph: ErrorsInParagraph = {
              errors: data.errors.map((error) => {
                return {
                  ...error,
                  error_id: generateUniqueId("error-"),
                };
              }),
              target_id: data.target_id,
              errorParagraph_id: generateUniqueId("paragraph-error-"),
            };
            try {
              // Update UI with results
              state.appendErrors(errorsInParagraph);
              const processedDocument = await ErrorToBinding(errorsInParagraph);
              state.editorRef.current.setData(
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
    errorParagraphs: [],
    appendErrors: (newErrors: ErrorsInParagraph) => {
      set((state) => {
        console.log(state);
        return {
          errorParagraphs: [...state.errorParagraphs, newErrors],
        };
      });
    },
    choiceError: "",
    setChoiceError: (error_id: string) => set({ choiceError: error_id }),
  };
});

async function ErrorToBinding(errorData: ErrorsInParagraph): Promise<Document> {
  const clonedDocument = document.cloneNode(true) as Document;

  const { target_id, errors: errors } = errorData;
  const targetElement = clonedDocument.querySelector(`[data-unique="${target_id}"]`);

  if (targetElement) processErrorsInElement(targetElement, errors);

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
      const errorId = errorDetail.error_id;
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
