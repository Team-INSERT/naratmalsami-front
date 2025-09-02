import { findForeignWord } from "./lstm/findForeignWord";
import { dify } from "./dify/dify";
import generateUniqueId, { Prefix } from "../generateUniqueId";

interface refineResponseType {
  target_id: string;
  errors: {
    code: number;
    origin_word: string;
    refine_word: string[];
    index: number;
  }[];
}

export interface foreignSentenceType {
  target_id: string;
  sentence: string;
  foreignWord: string[];
  fullsentence: string;
}

export async function* refineForeign(inputData: string[]) {
  const foreignSentenceList: foreignSentenceType[] = [];

  for (const html of inputData) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const content = doc.body.textContent || "";
    let target_id = doc.querySelector("[data-unique]")?.getAttribute("data-unique") as string;
    if (!target_id) {
      target_id = generateUniqueId(Prefix.UNIQUE);
    }

    const { foreignWords, sentenceList } = await findForeignWord(content);

    for (const sentence of sentenceList) {
      const foreignInSentence = foreignWords.filter((word) => sentence.includes(word));

      if (foreignInSentence.length) {
        foreignSentenceList.push({
          target_id,
          sentence,
          foreignWord: foreignInSentence,
          fullsentence: content,
        });
      }
    }
  }

  const pending = new Set<Promise<{ response: refineResponseType }>>();

  foreignSentenceList.forEach((foreignSentence) => {
    const p = dify(foreignSentence).then((difyResponse) => ({
      response: {
        target_id: difyResponse.target_id,
        errors: Object.entries(difyResponse.refineWord)
          .map(([origin_word, refine_word]) => {
            const index = foreignSentence.fullsentence.indexOf(origin_word);
            if (index === -1) {
              return;
            }
            return {
              code: 1,
              origin_word,
              refine_word,
              index,
            };
          })
          .filter((error) => error !== undefined),
      },
    }));
    pending.add(p);
  });

  while (pending.size > 0) {
    const finished = await Promise.race(pending);

    for (const p of pending) {
      p.then((data) => {
        if (data === finished) {
          pending.delete(p);
        }
      });
    }

    yield finished.response;
  }
}
