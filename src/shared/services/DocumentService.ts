import { ErrorsInParagraph, ErrorDetail, ErrorsInParagraphData } from "@/shared/stores/error";
import generateUniqueId, { Prefix } from "@/utils/generateUniqueId";
import DecoupledEditor from "@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor";
import replaceSubstring from "@/utils/replaceSubstring";
import { ErrorParagraphsRepository } from "./ErrorParagraphsRepository";

export interface EditorRef {
  current: DecoupledEditor | null;
}

export class DocumentService {
  private editorRef: EditorRef = { current: null };
  private previousDocuments: string[] = [];

  private errorParagraphsRepository: ErrorParagraphsRepository = new ErrorParagraphsRepository();
  public initDocument(editorRef: EditorRef): void {
    this.editorRef = editorRef;
  }

  private _getClonedDocument(): Document {
    return document.cloneNode(true) as Document;
  }

  private _doesWordExistAtIndex(text: string, word: string, index: number): boolean {
    const existsAtIndex = text.slice(index, index + word.length) === word;
    if (!existsAtIndex) {
      console.error(`Word "${word}" does not exist at index ${index} in the text.\nText: ${text}`);
    }
    return existsAtIndex;
  }

  private _createErrorSpan(id: string, text: string): string {
    return `<span id="${id}" class="__origin_word__">${text}</span>`;
  }

  private _processErrorsInElement(element: Element, errorsInParagraph: ErrorsInParagraph): void {
    let currentHTML = element.innerHTML;
    const errors = errorsInParagraph.errors;

    const sortedErrors = [...errors].sort((a, b) => a.index - b.index);
    let additionalIndex = 0;

    for (const errorDetail of sortedErrors) {
      const adjustedIndex = errorDetail.index + additionalIndex;

      if (this._doesWordExistAtIndex(currentHTML, errorDetail.origin_word, adjustedIndex)) {
        this.errorParagraphsRepository.addErrorParagraphs([errorsInParagraph]);
        const errorId = errorDetail.error_id;
        const wrappedWord = this._createErrorSpan(errorId, errorDetail.origin_word);

        currentHTML = replaceSubstring(
          currentHTML,
          adjustedIndex,
          adjustedIndex + errorDetail.origin_word.length,
          wrappedWord
        );

        additionalIndex += wrappedWord.length - errorDetail.origin_word.length;
      }
    }
    element.innerHTML = currentHTML;
  }

  async bindErrorsToElement(errorData: ErrorsInParagraph): Promise<Document> {
    const clonedDocument = this._getClonedDocument();
    const targetElement = clonedDocument.querySelector(`[data-unique="${errorData.target_id}"]`);

    if (targetElement) this._processErrorsInElement(targetElement, errorData);
    else throw new Error(`Element with data-unique="${errorData.target_id}" not found.`);
    return clonedDocument;
  }

  public resolveError(error: ErrorDetail): Document {
    const clonedDocument = this._getClonedDocument();
    const targetElement = clonedDocument.querySelector(`#${error.error_id}`);

    if (targetElement) {
      targetElement.innerHTML = error.refine_word[0];
    }

    this._setDocumentToEditor(clonedDocument);
    this.errorParagraphsRepository.removeErrorById(error.error_id);
    return clonedDocument;
  }

  public async handleAiRefinement(
    aiRefinements: AsyncGenerator<ErrorsInParagraphData>
  ): Promise<void> {
    for await (const refinement of aiRefinements) {
      const errorsInParagraph: ErrorsInParagraph = {
        errors: refinement.errors.map((errorItem) => ({
          ...errorItem,
          error_id: generateUniqueId(Prefix.ERROR),
        })),
        target_id: refinement.target_id,
        errorParagraph_id: generateUniqueId(Prefix.PARAGRAPH_ERROR),
      };

      // this.errorParagraphsRepository.addErrorParagraphs([errorsInParagraph]);

      const processedDocument = await this.bindErrorsToElement(errorsInParagraph);
      this._setDocumentToEditor(processedDocument);
    }
  }

  private _setDocumentToEditor(document: Document): void {
    this.editorRef.current?.setData(document.querySelector(".ck-content")?.innerHTML as string);
  }

  public subscribe(listener: () => void): () => void {
    return this.errorParagraphsRepository.subscribe(listener);
  }

  // Getters and Setters

  public setPreviousDocuments(documents: string[]): void {
    this.previousDocuments = documents;
  }
  public getPreviousDocuments(): string[] {
    return this.previousDocuments;
  }
  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return this.errorParagraphsRepository.getErrorParagraphs();
  }
}
