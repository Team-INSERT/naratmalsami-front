import deepDiff from "deep-diff";
import { ErrorDetail, ErrorsInParagraph } from "./error";
import { HtmlProcessor } from "@/utils/HtmlProcessor";
import { AiService } from "@/utils/AiService";
import { DocumentService } from "@/shared/services/DocumentService";
import { EditorRef } from "@/shared/services/DocumentService";
export class DocumentManager {
  private documentProcessor: HtmlProcessor = new HtmlProcessor();
  private static documentService: DocumentService;
  private static isAiRefineProcessing: boolean = false;

  constructor() {
    this.documentProcessor = new HtmlProcessor();
    if (!DocumentManager.documentService) {
      DocumentManager.documentService = new DocumentService();
    }
  }

  public initDocument(editorRef: EditorRef): void {
    DocumentManager.documentService.initDocument(editorRef);
  }

  public resolveError(error: ErrorDetail): void {
    const resolvedDocument = DocumentManager.documentService.resolveError(error);

    DocumentManager.documentService.setPreviousDocuments(
      this.documentProcessor.processHtmlDocument(
        resolvedDocument.querySelector(".ck-editor__editable")?.innerHTML as string
      )
    );
  }
  private static modificationQueue: Promise<void> = Promise.resolve();

  public handleDocumentModifications(documentContext: string): Promise<void> {
    // Add the modification to the queue
    DocumentManager.modificationQueue = DocumentManager.modificationQueue.then(() =>
      this._processDocumentModification(documentContext)
    );
    return DocumentManager.modificationQueue;
  }

  private async _processDocumentModification(documentContext: string): Promise<void> {
    const editedDocument = this.documentProcessor.processHtmlDocument(documentContext);
    const previousDocument = DocumentManager.documentService.getPreviousDocuments();

    const differences = deepDiff.diff(
      HtmlProcessor.prepareDiff(previousDocument),
      HtmlProcessor.prepareDiff(editedDocument)
    );

    if (!differences || differences.length === 0) {
      return;
    }

    const modifiedElements = this.documentProcessor.extractModifiedElements(
      differences,
      editedDocument
    );

    await DocumentManager.documentService.handleAiRefinement(
      AiService.fetchAiRefinementsLocal(modifiedElements)
    );
    DocumentManager.documentService.setPreviousDocuments(editedDocument);
  }

  // for React

  public subscribe(listener: () => void): () => void {
    return DocumentManager.documentService.subscribe(listener);
  }

  // Getters and Setters
  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return DocumentManager.documentService.getErrorParagraphs();
  }
}
