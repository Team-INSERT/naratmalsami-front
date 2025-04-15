import { ErrorsInParagraphData, ErrorDetail } from "@/shared/stores/error";
import { refineForeign } from "./ai/refineForeign";
import generateUniqueId from "./generateUniqueId";

export class AiService {
  static async getAiRefinements(modifiedElements: string[]): Promise<ErrorsInParagraphData[]> {
    return import.meta.env.VITE_USE_MOCK_AI === "true"
      ? this.fetchAiRefinementsMock(modifiedElements)
      : this.fetchAiRefinements(modifiedElements);
  }
  static async *fetchAiRefinementsLocal(
    modifiedElements: string[]
  ): AsyncGenerator<ErrorsInParagraphData> {
    const generator = refineForeign(modifiedElements);

    for await (const element of generator) {
      console.log(element);

      const errorWithIds = element.errors.map((errorItem) => ({
        ...errorItem,
        error_id: generateUniqueId("error-"),
      }));

      yield {
        target_id: element.target_id,
        errors: errorWithIds,
      };
    }
  }
  static async fetchAiRefinements(modifiedElements: string[]): Promise<ErrorsInParagraphData[]> {
    const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/ai/refine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: '<p data-unique="e-0">http</p>',
        content: modifiedElements,
      }),
      mode: "cors",
    });

    return response.json();
  }
  static async fetchAiRefinementsMock(
    modifiedElements: string[]
  ): Promise<ErrorsInParagraphData[]> {
    //use domparser
    const parser = new DOMParser();
    const document = parser.parseFromString(modifiedElements.join(""), "text/html");
    const errorData: ErrorsInParagraphData[] = [];
    const elements = document.querySelectorAll("[data-unique]");
    elements.forEach((element) => {
      const target_id = element.getAttribute("data-unique") || "";
      const error: ErrorDetail[] = [
        {
          code: 0,
          origin_word: element.textContent?.split(" ")[0] || "",
          refine_word: ["자료", "정보"],
          index: 0,
          error_id: generateUniqueId("error-"),
        },
      ];
      errorData.push({ target_id, errors: error });
    });
    return errorData;
  }
}
