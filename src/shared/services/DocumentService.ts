import { ErrorsInParagraph, ErrorDetail, ErrorsInParagraphData } from "@/shared/stores/error";
import generateUniqueId, { Prefix } from "@/utils/generateUniqueId";
import DecoupledEditor from "@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor";
import replaceSubstring from "@/utils/replaceSubstring";

export interface EditorRef {
  current: DecoupledEditor | null;
}

export class DocumentService {
  private editorRef: EditorRef = { current: null };
  private isProcessing: boolean = false;
  private previousDocuments: string[] = [];
  private errorParagraphs: ReadonlyArray<ErrorsInParagraph> = []; // ReadonlyArray로 변경하여 불변성을 유지, 불변성이 없다면 useState에서 변경사항을 캐치하지 못함
  public initDocument(editorRef: EditorRef): void {
    this.editorRef = editorRef;
  }

  private getClonedDocument(): Document {
    return document.cloneNode(true) as Document;
  }

  private doesWordExistAtIndex(text: string, word: string, index: number): boolean {
    const existsAtIndex = text.slice(index, index + word.length) === word;
    if (!existsAtIndex) {
      console.error(`Word "${word}" does not exist at index ${index} in the text.\nText: ${text}`);
    }
    return existsAtIndex;
  }

  private createErrorSpan(id: string, text: string): string {
    return `<span id="${id}" class="__origin_word__">${text}</span>`;
  }

  private processErrorsInElement(element: Element, errors: ErrorDetail[]): void {
    let currentHTML = element.innerHTML;

    const sortedErrors = [...errors].sort((a, b) => a.index - b.index);
    let additionalIndex = 0;

    for (const errorDetail of sortedErrors) {
      const adjustedIndex = errorDetail.index + additionalIndex;

      if (this.doesWordExistAtIndex(currentHTML, errorDetail.origin_word, adjustedIndex)) {
        const errorId = errorDetail.error_id;
        const wrappedWord = this.createErrorSpan(errorId, errorDetail.origin_word);

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

  async errorToBinding(errorData: ErrorsInParagraph): Promise<Document> {
    const clonedDocument = this.getClonedDocument();
    const targetElement = clonedDocument.querySelector(`[data-unique="${errorData.target_id}"]`);

    if (targetElement) this.processErrorsInElement(targetElement, errorData.errors);
    this.notify();

    return clonedDocument;
  }

  public resolveError(error: ErrorDetail): Document {
    const clonedDocument = this.getClonedDocument();
    const targetElement = clonedDocument.querySelector(`#${error.error_id}`);

    if (targetElement) {
      targetElement.innerHTML = error.refine_word[0];
    }

    this.setDocumentToEditor(clonedDocument);
    this.errorParagraphs = this.errorParagraphs
      .map((errorParagraph) => ({
        target_id: errorParagraph.target_id,
        errorParagraph_id: errorParagraph.errorParagraph_id,
        errors: errorParagraph.errors.filter((errorItem) => errorItem.error_id !== error.error_id),
      }))
      .filter((errorParagraph) => errorParagraph.errors.length > 0);
    this.notify();

    return clonedDocument;
  }

  public async handleAiRefinement(
    aiRefinements: AsyncGenerator<ErrorsInParagraphData>
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      for await (const refinement of aiRefinements) {
        const errorsInParagraph: ErrorsInParagraph = {
          errors: refinement.errors.map((errorItem) => ({
            ...errorItem,
            error_id: generateUniqueId(Prefix.ERROR),
          })),
          target_id: refinement.target_id,
          errorParagraph_id: generateUniqueId(Prefix.PARAGRAPH_ERROR),
        };

        this.errorParagraphs = [...this.errorParagraphs, errorsInParagraph];

        const processedDocument = await this.errorToBinding(errorsInParagraph);
        this.setDocumentToEditor(processedDocument);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private setDocumentToEditor(document: Document): void {
    this.editorRef.current?.setData(document.querySelector(".ck-content")?.innerHTML as string);
  }

  // For React
  private listners: (() => void)[] = [];
  public subscribe(listener: () => void): () => void {
    this.listners.push(listener);
    return this.unsubscribe.bind(this, listener);
  }
  private unsubscribe(listener: () => void): void {
    this.listners = this.listners.filter((l) => l !== listener);
  }
  private notify(): void {
    console.log("notify");
    this.listners.forEach((listener) => listener());
  }

  // Getters and Setters

  public setPreviousDocuments(documents: string[]): void {
    this.previousDocuments = documents;
  }
  public getPreviousDocuments(): string[] {
    return this.previousDocuments;
  }
  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return this.errorParagraphs;
  }
}
