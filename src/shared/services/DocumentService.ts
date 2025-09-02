import {
  ErrorsInParagraph,
  ErrorDetail,
  ErrorsInParagraphData,
} from "@/shared/stores/error";
import generateUniqueId, { Prefix } from "@/utils/generateUniqueId";
import DecoupledEditor from "@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor";
import replaceSubstring from "@/utils/replaceSubstring";
import { ErrorParagraphsRepository } from "./ErrorParagraphsRepository";
import { HtmlProcessor } from "@/utils/HtmlProcessor";
import translateJosa from "@/utils/josa/translateJosa";

export interface EditorRef {
  current: DecoupledEditor | null;
}
/**
 * 문서 내 외래어 단어 감지, 하이라이트, 교정 반영을 담당하는 서비스 클래스입니다.
 * @class DocumentService
 */
export class DocumentService {
  private editorRef: EditorRef = { current: null };
  private previousDocuments: Map<string, string> = new Map();
  private errorParagraphsRepository: ErrorParagraphsRepository =
    new ErrorParagraphsRepository();

  /**
   * 에디터 참조를 초기화합니다.
   * @param editorRef 에디터 참조 객체
   */
  public initDocument(editorRef: EditorRef): void {
    this.editorRef = editorRef;
  }

  /**
   * 현재 document를 깊은 복사하여 반환합니다.
   * @returns 복제된 Document 객체
   */
  private _getClonedDocument(): Document {
    return document.cloneNode(true) as Document;
  }

  /**
   * 주어진 인덱스에 특정 단어가 존재하는지 확인합니다.
   * @param text 전체 텍스트
   * @param word 찾을 단어
   * @param index 검사할 인덱스
   * @returns 단어 존재 여부 (boolean)
   */
  private _findWordIndex(text: string, word: string, index: number): number {
    if (text.slice(index, index + word.length) === word) return index;
    else {
      const foundIndex = text.indexOf(word);
      if (foundIndex !== -1) {
        console.warn(
          `Word "${word}" found at index ${foundIndex} in the text.`
        );
      } else {
        console.error(`Word "${word}" not found in the text.`);
      }
      return foundIndex;
    }
  }

  /**
   * 외래어 단어를 감싸는 span 태그 문자열을 생성합니다.
   * @param id 외래어 식별자
   * @param text 감쌀 텍스트
   * @returns span 태그 문자열
   */
  private _createErrorSpan(id: string, text: string): string {
    return `<span originid="${id}" class="__origin_word__">${text}</span>`;
  }

  /**
   * 요소 내 외래어 단어들을 span으로 감싸 하이라이트 처리합니다.
   * @param element 대상 요소
   * @param errorsInParagraph 외래어 정보가 포함된 단락 데이터
   */
  private _processErrorsInElement(
    element: Element,
    errorsInParagraph: ErrorsInParagraph
  ): void {
    let currentHTML = element.innerHTML;
    const errors = errorsInParagraph.errors;

    const sortedErrors = [...errors].sort((a, b) => a.index - b.index);
    let additionalIndex = 0;

    let flag = false;
    for (const errorDetail of sortedErrors) {
      const adjustedIndex = errorDetail.index + additionalIndex;

      const foundIndex = this._findWordIndex(
        currentHTML,
        errorDetail.origin_word,
        adjustedIndex
      );

      if (foundIndex !== -1) {
        flag = true;
        const errorId = errorDetail.error_id;
        const wrappedWord = this._createErrorSpan(
          errorId,
          errorDetail.origin_word
        );

        currentHTML = replaceSubstring(
          currentHTML,
          foundIndex,
          foundIndex + errorDetail.origin_word.length,
          wrappedWord
        );

        additionalIndex += wrappedWord.length - errorDetail.origin_word.length;
      }
    }
    if (flag) {
      const existingErrorParagraph =
        this.errorParagraphsRepository.getErrorParagraphById(
          errorsInParagraph.target_id
        );
      if (existingErrorParagraph) {
        const clonedDocument = this._getClonedDocument();
        existingErrorParagraph.errors.map((error) => {
          const element = clonedDocument.querySelector(
            `[originid="${error.error_id}"]`
          );
          element?.removeAttribute("originid");
          console.log("element", element);
        });
        this._setDocumentToEditor(clonedDocument);
        this.errorParagraphsRepository.deleteErrorParagraph(
          existingErrorParagraph
        );
      }

      this.errorParagraphsRepository.addErrorParagraphs([errorsInParagraph]);
    }
    element.innerHTML = currentHTML;
  }

  /**
   * 외래어 정보를 기반으로 문서 내 특정 요소에 외래어 표시를 바인딩합니다.
   * @param errorData 외래어 정보가 포함된 단락 데이터
   * @returns 외래어가 바인딩된 복제 문서
   */
  async bindErrorsToElement(errorData: ErrorsInParagraph): Promise<Document> {
    const clonedDocument = this._getClonedDocument();
    const targetElement = clonedDocument.querySelector(
      `[data-unique="${errorData.target_id}"]`
    );

    if (targetElement) this._processErrorsInElement(targetElement, errorData);
    else
      throw new Error(
        `Element with data-unique="${errorData.target_id}" not found.`
      );
    return clonedDocument;
  }

  /**
   * 외래어 단어를 삭제합니다. (레포지터리 내에서만)
   * @param error_id 삭제할 외래어의 ID
   * @returns 삭제된 문서
   */
  public deleteOriginWordById(error_id: string) {
    this.errorParagraphsRepository.deleteOriginWordById(error_id);
  }

  /**
   * 교정된 외래어 단어를 삭제합니다. (레포지터리 내에서만)
   * @param refine_id 삭제할 외래어의 ID
   */
  public deleteRefinedWordById(refine_id: string) {
    this.errorParagraphsRepository.deleteRefinedWordById(refine_id);
  }

  public removeErrorByTargetId(targetId: string): void {
    this.errorParagraphsRepository.removeErrorByTargetId(targetId);
  }

  /**
   * @description
   * 주어진 요소(el) 바로 뒤에 붙은 조사(originJosa)를 추출해
   * translateJosa로 교정된 조사로 대체한다.
   */
  private _adjustJosaAfterElement(el: HTMLElement): void {
    const next = el.nextSibling;
    if (!next) return;

    const rawText = next.textContent ?? "";
    // 공백-only 노드면 무시
    if (/^\s+$/.test(rawText)) return;

    // 첫 공백 전까지를 원조사로
    const match = rawText.match(/^(\S+)/);
    if (!match) return;

    const [originalJosa] = match;
    const corrected = translateJosa(el.textContent!, originalJosa);
    if (!corrected || corrected === originalJosa) return;

    // 앞공백 유지 + 교정된 조사 + 나머지 텍스트
    const leadingSpaces = rawText.slice(
      0,
      rawText.indexOf(rawText.trimStart())
    );
    const rest = rawText.slice(leadingSpaces.length + originalJosa.length);
    const newText = leadingSpaces + corrected + rest;

    if (next.nodeType === Node.TEXT_NODE) {
      next.textContent = newText;
    } else if (next.nodeType === Node.ELEMENT_NODE) {
      (next as HTMLElement).textContent = newText;
    }
  }

  /**
   * 특정 외래어 단어를 교정 단어로 대체합니다.
   * @param error 외래어 상세 정보
   * @returns 교정이 반영된 복제 문서
   */
  public resolveError(error: ErrorDetail): Document {
    const clonedDoc = this._getClonedDocument();
    const targetEl = clonedDoc.querySelector<HTMLElement>(
      `[originid="${error.error_id}"]`
    );

    if (!targetEl) {
      console.error(`Element with originid="${error.error_id}" not found.`);
      return clonedDoc;
    }

    targetEl.innerHTML = error.refine_word[0];
    this.errorParagraphsRepository.resolveErrorById(error.error_id);

    this._adjustJosaAfterElement(targetEl);

    targetEl.removeAttribute("originid");
    targetEl.setAttribute("refineid", error.error_id);
    this._setDocumentToEditor(clonedDoc);

    return clonedDoc;
  }

  /**
   * AI 교정 결과를 비동기적으로 받아 문서에 반영합니다.
   * @param aiRefinements AI 교정 결과 AsyncGenerator
   */
  public async handleAiRefinement(
    aiRefinements: AsyncGenerator<ErrorsInParagraphData>
  ): Promise<void> {
    for await (const refinement of aiRefinements) {
      const errorsInParagraph: ErrorsInParagraph = {
        errors: refinement.errors,
        target_id: refinement.target_id,
        errorParagraph_id: generateUniqueId(Prefix.PARAGRAPH_ERROR),
      };

      const processedDocument = await this.bindErrorsToElement(
        errorsInParagraph
      );
      this._setDocumentToEditor(processedDocument);
    }
  }

  /**
   * 복제된 문서의 내용을 에디터에 반영합니다.
   * @param document 반영할 Document 객체
   */
  private _setDocumentToEditor(
    document: Document,
    isTriggingDocumentChangeEvent = false
  ): void {
    const ckEditorContentString = document.querySelector(".ck-content")
      ?.innerHTML as string;
    this.editorRef.current?.setData(ckEditorContentString);
    if (!isTriggingDocumentChangeEvent) {
      const processedHtml = new HtmlProcessor().processHtmlDocument(ckEditorContentString);
      this.setPreviousDocuments(HtmlProcessor.createParagraphMap(processedHtml));
    }
  }

  /**
   * 외래어 단락 저장소의 변경을 구독합니다.
   * @param listener 변경 시 호출될 콜백 함수
   * @returns 구독 해제 함수
   */
  public subscribe(listener: () => void): () => void {
    return this.errorParagraphsRepository.subscribe(listener);
  }

  public setPreviousDocuments(documents: Map<string, string>): void {
    this.previousDocuments = documents;
  }

  public getPreviousDocuments(): Map<string, string> {
    return this.previousDocuments;
  }

  /**
   * 현재 저장된 외래어 단락 목록을 반환합니다.
   * @returns 외래어 단락 배열 (읽기 전용)
   */
  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return this.errorParagraphsRepository.getErrorParagraphs();
  }
  public getResolvedErrors(): ReadonlyArray<ErrorDetail> {
    return this.errorParagraphsRepository.getResolvedErrors();
  }

  /**
   * 외래어를 Error Id로 검색합니다.
   * @param error_id 외래어 단락의 Error Id
   * @returns 외래어 단락 정보 (없으면 undefined)
   */
  public getErrorByErrorId(error_id: string): ErrorDetail | undefined {
    return this.errorParagraphsRepository.getErrorByErrorId(error_id);
  }

  public updateEditorContent(html: string): void {
    this.editorRef.current?.setData(html);
  }
}
