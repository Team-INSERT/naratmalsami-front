import { ErrorsInParagraph } from "../stores/error";

export class ErrorParagraphsRepository {
  private errorParagraphsMap: Map<string, ErrorsInParagraph> = new Map();

  constructor() {
    this.errorParagraphsMap = new Map();
  }

  public addErrorParagraphs(errorParagraphs: ReadonlyArray<ErrorsInParagraph>): void {
    for (const errorParagraph of errorParagraphs) {
      this.errorParagraphsMap.set(errorParagraph.target_id, errorParagraph);
    }
    this._notify();
  }

  public removeErrorParagraphById(errorParagraphId: string): void {
    if (!errorParagraphId) throw new Error("errorParagraphId is undefined");
    // Find the entry with the given errorParagraph_id
    const entry = Array.from(this.errorParagraphsMap.values()).find(
      (errorParagraph) => errorParagraph.errorParagraph_id === errorParagraphId
    );
    if (!entry) throw new Error(`errorParagraphId ${errorParagraphId} not found`);
    this.errorParagraphsMap.delete(entry.target_id);
    this._notify();
  }

  public removeErrorByTargetId(targetId: string): void {
    if (!targetId) throw new Error("targetId is undefined");
    if (!this.errorParagraphsMap.get(targetId)) throw new Error(`targetId ${targetId} not found`);
    this.errorParagraphsMap.delete(targetId);
    this._notify();
  }

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

  public getErrorParagraphs(): ReadonlyArray<ErrorsInParagraph> {
    return Array.from(this.errorParagraphsMap.values());
  }

  public clearErrorParagraphs(): void {
    this.errorParagraphsMap.clear();
    this._notify();
  }

  public getErrorParagraphById(errorParagraphId: string): ErrorsInParagraph | undefined {
    return Array.from(this.errorParagraphsMap.values()).find(
      (errorParagraph) => errorParagraph.errorParagraph_id === errorParagraphId
    );
  }

  // For React

  private eventListeners: (() => void)[] = [];
  public subscribe(listener: () => void): () => void {
    this.eventListeners.push(listener);
    return this._unsubscribe.bind(this, listener);
  }
  private _unsubscribe(listener: () => void): void {
    this.eventListeners = this.eventListeners.filter((l) => l !== listener);
  }
  private _notify(): void {
    console.log("notify");
    this.eventListeners.forEach((listener) => listener());
  }
}
