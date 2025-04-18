import { ErrorDetail, ErrorsInParagraph } from "../stores/error";

/**
 * 외래어가 포함된 문단과 그 문단에 포함된 외래어 정보를 관리하는 클래스입니다.
 * 외래어 단락을 추가, 제거 및 조회 및 구독하는 기능을 제공합니다.
 * @class ErrorParagraphsRepository
 */
export class ErrorParagraphsRepository {
  private errorParagraphsMap: Map<string, ErrorsInParagraph> = new Map();
  private resolvedErrorParagraphsMap: Map<string, ErrorDetail> = new Map();

  constructor() {
    this.errorParagraphsMap = new Map();
    this.resolvedErrorParagraphsMap = new Map();
  }
  /**
   * 외래어 단락을 추가합니다.
   * @param errorParagraphs 외래어 단락 정보
   */
  public addErrorParagraphs(errorParagraphs: ReadonlyArray<ErrorsInParagraph>): void {
    for (const errorParagraph of errorParagraphs) {
      this.errorParagraphsMap.set(errorParagraph.target_id, errorParagraph);
    }
    this._notify();
  }

  private _addResolvedErrors(errors: ReadonlyArray<ErrorDetail>): void {
    for (const error of errors) {
      this.resolvedErrorParagraphsMap.set(error.error_id, error);
    }
    this._notify();
  }

  /**
   * 외래어 단락을 외래어 단락 ID로 제거합니다.
   * @param errorParagraphId 외래어 단락 ID
   */
  public resolveErrorParagraphById(errorParagraphId: string): void {
    if (!errorParagraphId) throw new Error("errorParagraphId is undefined");
    // Find the entry with the given errorParagraph_id
    const entry = Array.from(this.errorParagraphsMap.values()).find(
      (errorParagraph) => errorParagraph.errorParagraph_id === errorParagraphId
    );
    if (!entry) throw new Error(`errorParagraphId ${errorParagraphId} not found`);
    this.errorParagraphsMap.delete(entry.target_id);
    this.resolvedErrorParagraphsMap.set(
      entry.target_id,
      entry.errors.find((e) => e.error_id === entry.errorParagraph_id) as ErrorDetail
    );
    this._notify();
  }
  /**
   * 외래어 단락을 단락 ID로 제거합니다.
   * @param targetId 외래어 단락의 타겟 ID
   */
  public removeErrorByTargetId(targetId: string): void {
    if (!targetId) throw new Error("targetId is undefined");
    if (!this.errorParagraphsMap.get(targetId)) throw new Error(`targetId ${targetId} not found`);
    this.errorParagraphsMap.delete(targetId);
    this._notify();
  }
  /**
   * 외래어 단락에서 특정 외래어를 제거합니다.
   * @param error_id 외래어 ID
   */
  public removeErrorById(error_id: string) {
    if (!error_id) throw new Error("error_id is undefined");
    for (const entry of this.errorParagraphsMap.values()) {
      const idx = entry.errors.findIndex((e) => e.error_id === error_id);
      if (idx !== -1) {
        entry.errors.splice(idx, 1);
        this._notify();
        return;
      }
    }
    throw new Error(`error_id ${error_id} not found`);
  }

  public resolveErrorById(error_id: string) {
    const entry = Array.from(this.errorParagraphsMap.values()).find((errorParagraph) =>
      errorParagraph.errors.some((e) => e.error_id === error_id)
    );
    if (!entry) throw new Error(`Error with id ${error_id} not found`);
    this._addResolvedErrors([entry.errors.find((e) => e.error_id === error_id) as ErrorDetail]);
    this.removeErrorById(error_id);
  }

  /**
   * 외래어 단락 목록을 가져옵니다.
   * @returns 외래어 단락 목록 (읽기 전용) ReadonlyArray<ErrorsInParagraph>
   */
  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return Array.from(this.errorParagraphsMap.values());
  }

  /**
   * 해결된 외래어 단락 목록 조회
   * @return {ReadonlyArray<ErrorsInParagraph>} 해결된 외래어 단락 목록
   */
  public getResolvedErrors(): ReadonlyArray<ErrorDetail> {
    return Array.from(this.resolvedErrorParagraphsMap.values());
  }

  /**
   * 외래어 단락 목록을 초기화합니다.
   */
  public clearErrorParagraphs(): void {
    this.errorParagraphsMap.clear();
    this.resolvedErrorParagraphsMap.clear();
    this._notify();
  }
  /**
   * 외래어 단락을 ID로 검색합니다.
   * @param errorParagraphId 외래어 단락 ID
   * @returns 외래어 단락 정보 (없으면 undefined)
   */

  public getErrorParagraphById(errorParagraphId: string): ErrorsInParagraph | undefined {
    return Array.from(this.errorParagraphsMap.values()).find(
      (errorParagraph) => errorParagraph.errorParagraph_id === errorParagraphId
    );
  }

  /**
   * 외래어를 Error Id로 검색합니다.
   * @param error_id 외래어 단락의 Error Id
   * @returns 외래어 단락 정보 (없으면 undefined)
   */
  public getErrorByErrorId(error_id: string): ErrorDetail | undefined {
    let foundError: ErrorDetail | undefined = undefined;
    Array.from(this.errorParagraphsMap.values()).forEach((errorParagraph) => {
      const error = errorParagraph.errors.find((e) => e.error_id === error_id);
      if (error) {
        foundError = error;
      }
    });
    return foundError;
  }

  // For React
  /**
   * 외래어 단락 목록 업데이트 시 호출될 콜백 함수의 배열입니다.
   * @private
   */
  private eventListeners: (() => void)[] = [];
  /**
   * 외래어 단락 목록 업데이트 시 호출될 콜백 함수를 구독합니다.
   * @param listener 변경 시 호출될 콜백 함수
   * @returns 구독 해제 함수
   */
  public subscribe(listener: () => void): () => void {
    this.eventListeners.push(listener);
    return this._unsubscribe.bind(this, listener);
  }
  /**
   * 구독 해제 함수입니다. 구독 후 반환되기에 private로 설정합니다.
   * @private
   * @param listener 구독 해제할 콜백 함수
   */
  private _unsubscribe(listener: () => void): void {
    this.eventListeners = this.eventListeners.filter((l) => l !== listener);
  }

  /**
   * 구독된 모든 리스너에게 업데이트 알림을 보냅니다.
   * @private
   */
  private _notify(): void {
    console.log("notify");
    this.eventListeners.forEach((listener) => listener());
  }
}
