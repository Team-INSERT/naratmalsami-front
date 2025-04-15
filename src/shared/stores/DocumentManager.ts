import deepDiff from "deep-diff";
import { ErrorDetail, ErrorsInParagraph } from "./error";
import { HtmlProcessor } from "@/utils/HtmlProcessor";
import { AiService } from "@/utils/AiService";
import { DocumentService } from "@/shared/services/DocumentService";
import { EditorRef } from "@/shared/services/DocumentService";

export class DocumentManager {
  private documentProcessor: HtmlProcessor = new HtmlProcessor();
  private static documentDomainService: DocumentService;

  constructor() {
    this.documentProcessor = new HtmlProcessor();
    if (!DocumentManager.documentDomainService) {
      DocumentManager.documentDomainService = new DocumentService();
    }
  }

  public initDocument(editorRef: EditorRef): void {
    DocumentManager.documentDomainService.initDocument(editorRef);
  }

  public resolveError(error: ErrorDetail): void {
    const resolvedDocument = DocumentManager.documentDomainService.resolveError(error);

    DocumentManager.documentDomainService.setPreviousDocuments(
      this.documentProcessor.processHtmlDocument(
        resolvedDocument.querySelector(".ck-editor__editable")?.innerHTML as string
      )
    );
  }

  public async handleDocumentModifications(documentContext: string): Promise<void> {
    const editedDocument = this.documentProcessor.processHtmlDocument(documentContext);
    const previousDocument = DocumentManager.documentDomainService.getPreviousDocuments();

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

    await DocumentManager.documentDomainService.handleAiRefinement(
      AiService.fetchAiRefinementsLocal(modifiedElements)
    );
    DocumentManager.documentDomainService.setPreviousDocuments(editedDocument);
  }

  // Getters and Setters
  public getErrorParagraphs(): ErrorsInParagraph[] {
    return DocumentManager.documentDomainService.getErrorParagraphs();
  }
  public getSelectedErrorId(): string {
    return DocumentManager.documentDomainService.getSelectedErrorId();
  }
  public setSelectedErrorId(errorId: string): void {
    DocumentManager.documentDomainService.selectErrorId(errorId);
  }
}
