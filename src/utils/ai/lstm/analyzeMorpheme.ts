import axios from "axios";

interface morpDataType {
  id: number;
  lemma: string;
  type: string;
  position: number;
  weight: number;
}

interface sentenceDataType {
  id: number;
  morp: morpDataType[];
  text: string;
}

export interface morphemeListType {
  lemma: string;
  type: string;
}

interface responseType {
  morphemeList: morphemeListType[];
  sentenceList: string[];
}

export const analyzeMorpheme = async (
  parsedText: string
): Promise<responseType> => {
  const URL = import.meta.env.VITE_ETRI_ADDRESS;
  const API_KEY = import.meta.env.VITE_ETRI_KEY;

  const morphemeList: morphemeListType[] = [];
  const sentenceList: string[] = [];

  try {
    const response = await axios.post(
      URL,
      {
        argument: {
          analysis_code: "morp",
          text: parsedText,
        },
      },
      {
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    response.data.return_object.sentence.forEach(
      (sentence: sentenceDataType) => {
        sentenceList.push(sentence.text);

        sentence.morp.forEach((morp: morpDataType) => {
          if (
            morp.type === "NNG" ||
            morp.type === "SL" ||
            morp.type === "NNP"
          ) {
            morphemeList.push({
              lemma: morp.lemma,
              type: morp.type,
            });
          }
        });
      }
    );
  } catch (error) {
    console.error("API 호출 중 에러 발생", error);
  }

  return { morphemeList, sentenceList };
};
