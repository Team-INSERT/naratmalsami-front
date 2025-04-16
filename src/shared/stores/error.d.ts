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
