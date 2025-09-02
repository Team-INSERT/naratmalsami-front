import { ErrorDetail, ErrorsInParagraph } from "./error";
import { HtmlProcessor } from "@/utils/HtmlProcessor";
import { AiService } from "@/utils/AiService";
import { DocumentService } from "@/shared/services/DocumentService";
import { EditorRef } from "@/shared/services/DocumentService";
import generateUniqueId, { Prefix } from "@/utils/generateUniqueId";
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
  private _ensureElementsHaveIds(html: string): { htmlWithIds: string; wasModified: boolean } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;
    let wasModified = false;

    Array.from(body.children).forEach((child) => {
      if (["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI"].includes(child.tagName)) {
        if (!child.hasAttribute("data-unique")) {
          const newId = generateUniqueId(Prefix.PARAGRAPH);
          child.setAttribute("data-unique", newId);
          wasModified = true;
        }
      }
    });

    return { htmlWithIds: body.innerHTML, wasModified };
  }

  private async _processDocumentModification(documentContext: string): Promise<void> {
    const { htmlWithIds, wasModified } = this._ensureElementsHaveIds(documentContext);

    if (wasModified) {
      DocumentManager.documentService.updateEditorContent(htmlWithIds);
      return;
    }

    const editedDocumentHtml = this.documentProcessor.processHtmlDocument(documentContext);
    const currentParagraphsMap = HtmlProcessor.createParagraphMap(editedDocumentHtml);
    const previousParagraphsMap = DocumentManager.documentService.getPreviousDocuments();

    const modifiedElements: string[] = [];
    const allIds = new Set([
      ...previousParagraphsMap.keys(),
      ...currentParagraphsMap.keys(),
    ]);

    allIds.forEach((id) => {
      const oldText = previousParagraphsMap.get(id);
      const newText = currentParagraphsMap.get(id);

      if (oldText === undefined && newText !== undefined) {
        // Added
        const elementHtml = editedDocumentHtml.find((el) => el.includes(`data-unique="${id}"`));
        if (elementHtml) modifiedElements.push(elementHtml);
      } else if (oldText !== undefined && newText === undefined) {
        // Deleted
        DocumentManager.documentService.removeErrorByTargetId(id);
      } else if (oldText !== newText) {
        // Modified
        const elementHtml = editedDocumentHtml.find((el) => el.includes(`data-unique="${id}"`));
        if (elementHtml) modifiedElements.push(elementHtml);
      }
    });

    if (modifiedElements.length === 0) {
      DocumentManager.documentService.setPreviousDocuments(currentParagraphsMap);
      return;
    }

    console.debug("Modified Elements for AI:", modifiedElements);

    DocumentManager.documentService.setPreviousDocuments(currentParagraphsMap);
    await DocumentManager.documentService.handleAiRefinement(
      AiService.fetchAiRefinementsLocal(modifiedElements)
    );
  }

  public deleteOriginWordById(error_id: string) {
    DocumentManager.documentService.deleteOriginWordById(error_id);
  }

  public deleteRefinedWordById(refine_id: string) {
    DocumentManager.documentService.deleteRefinedWordById(refine_id);
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

  public getResolvedErrors(): ReadonlyArray<ErrorDetail> {
    return DocumentManager.documentService.getResolvedErrors();
  }

  /**
   * 외래어를 Error Id로 검색합니다.
   * @param error_id 외래어 단락의 Error Id
   * @returns 외래어 단락 정보 (없으면 undefined)
   */
  public getErrorByErrorId(error_id: string): ErrorDetail | undefined {
    return DocumentManager.documentService.getErrorByErrorId(error_id);
  }
}
