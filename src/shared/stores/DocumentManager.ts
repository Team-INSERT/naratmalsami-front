import deepDiff from "deep-diff";
import { ErrorDetail, ErrorsInParagraph } from "./error";
import { HtmlProcessor } from "@/utils/HtmlProcessor";
import { AiService } from "@/utils/AiService";
import { DocumentService } from "@/shared/services/DocumentService";
import { EditorRef } from "@/shared/services/DocumentService";
/**
 * 문서 관리를 위한 DocumentManager 클래스입니다.
 * 외래어 순화, 문서 수정 처리, 구독 등 다양한 기능을 제공합니다.
 * @class DocumentManager
 */

export class DocumentManager {
  private documentProcessor: HtmlProcessor = new HtmlProcessor();
  private static documentService: DocumentService;

  constructor() {
    this.documentProcessor = new HtmlProcessor();
    if (!DocumentManager.documentService) {
      DocumentManager.documentService = new DocumentService();
    }
  }
  /**
   * 에디터 참조를 받아 문서를 초기화합니다.
   *
   * @param editorRef 에디터 참조 객체
   */
  public initDocument(editorRef: EditorRef): void {
    DocumentManager.documentService.initDocument(editorRef);
  }

  /**
   * 외래어 정보를 받아 순화어로 대치합니다.
   *
   * @param error 외래어 상세 정보 객체
   */
  public resolveError(error: ErrorDetail): void {
    const resolvedDocument = DocumentManager.documentService.resolveError(error);

    DocumentManager.documentService.setPreviousDocuments(
      this.documentProcessor.processHtmlDocument(
        resolvedDocument.querySelector(".ck-editor__editable")?.innerHTML as string
      )
    );
  }
  private static modificationQueue: Promise<void> = Promise.resolve();
  /**
   * 문서 컨텍스트를 받아 문서 수정 작업을 큐에 추가하고 순차적으로 처리합니다.
   *
   * @param documentContext 수정된 문서의 HTML 문자열
   * @returns Promise<void> 수정 작업이 완료되면 resolve되는 promise
   */
  public handleDocumentModifications(documentContext: string): Promise<void> {
    // Add the modification to the queue
    DocumentManager.modificationQueue = DocumentManager.modificationQueue.then(() =>
      this._processDocumentModification(documentContext)
    );
    return DocumentManager.modificationQueue;
  }
  /**
   * 실제 문서 수정 작업을 비동기로 처리합니다.
   *
   * @param documentContext 수정된 문서의 HTML 문자열
   * @returns Promise<void> 수정 작업이 완료되면 resolve되는 promise
   */
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
  /**
   * 리스너를 구독하여 문서 변경 시 알림을 받을 수 있습니다. React 컴포넌트에서 사용됩니다.
   *
   * @param listener 변경 시 호출될 콜백 함수
   * @returns () => void 구독 해제 함수
   */
  public subscribe(listener: () => void): () => void {
    return DocumentManager.documentService.subscribe(listener);
  }

  // Getters and Setters
  /**
   * 외래어가 포함된 문단 목록을 읽기 전용 배열로 반환합니다.
   *
   * @returns ReadonlyArray<ErrorsInParagraph> 외래어 문단 배열
   */
  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return DocumentManager.documentService.getErrorParagraphs();
  }
}
