import axios from "axios"
import { foreignSentenceType } from "../refineForeign";

export const dify = (foreignSentence: foreignSentenceType) => {
  const URL = import.meta.env.VITE_DIFY_ADDRESS;
  const API_KEY = import.meta.env.VITE_DIFY_KEY;

  const result: Record<string, string[]> = {};
  const foreignWords = foreignSentence.foreignWord.join(", ");

  return axios.post(`${URL}/workflows/run`,
    {
      inputs: {
        foreign_words: foreignWords,
        text_to_replace: foreignSentence.sentence
      },
      response_mode: "blocking",
      user: "asdfasdf-123"
    },
    {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  ).then(response => {
    const responseText = response.data.data.outputs.text;
    const match = responseText.match(/\{[\s\S]*\}/);
    const parsedJson = JSON.parse(match[0]);
    Object.assign(result, parsedJson)

    return {
      target_id: foreignSentence.target_id,
      refineWord: result,
      sentence: foreignSentence.sentence
     };
  })
}