export interface ErrorDetail {
  code: number;
  origin_word: string;
  refine_word: string[];
  index: number;
  error_id: string;
}
export interface ErrorsInParagraphData {
  target_id: string;
  errors: ErrorDetail[];
}
export interface ErrorsInParagraph extends ErrorsInParagraphData {
  errorParagraph_id: string;
}

export interface RefineState {
  preDocument: string[];
  replaceWord: (error: ErrorDetail) => void;
  editorRef: any;
  initDocument: (editorRef: any) => void;
  updateDocument: (documentContext: string, editorRef: any) => void;
  onProcessing: boolean;
  errorParagraphs: ErrorsInParagraph[];
  appendErrors: (newErrors: ErrorsInParagraph) => void;
  choiceError: string;
  setChoiceError: (error_id: string) => void;
}
