import { findForeignWord } from "./lstm/findForeignWord";
import { dify } from "./dify/dify";

interface refineResponseType {
  target_id: string;
  error: {
    code: number,
    origin_word: string,
    refine_word: string[],
    index: number
  }[];
}

export interface foreignSentenceType {
  target_id: string;
  sentence: string;
  foreignWord: string[];
}

export async function* refineForeign(inputData: string[]) {
  const foreignSentenceList: foreignSentenceType[] = [];

  for (const html of inputData) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.body.textContent || "";
    const target_id = doc.body.querySelector("p")?.getAttribute("data-unique") as string;

    const { foreignWords, sentenceList } = await findForeignWord(content);

    for (const sentence of sentenceList) {
      const foreignInSentence = foreignWords.filter((word) => sentence.includes(word));

      if (foreignInSentence.length) {
        foreignSentenceList.push({
          target_id,
          sentence,
          foreignWord: foreignInSentence
        });
      }
    }
  }

  const pending = new Set<Promise<{ response: refineResponseType }>>();

  foreignSentenceList.forEach((foreignSentence) => {
    const p = dify(foreignSentence).then(difyResponse => ({ 
      response: {
        target_id: difyResponse.target_id,
        error: Object.entries(difyResponse.refineWord).map(([origin_word, refine_word]) => ({
          code: 1,
          origin_word,
          refine_word,
          index: foreignSentence.sentence.indexOf(origin_word)
        }))
      }
    }));
    pending.add(p);
  });

  while (pending.size > 0) {
    const finished = await Promise.race(pending);
    
    for (const p of pending) {
      p.then(data => {
        if (data === finished) {
          pending.delete(p);
        }
      })
    }

    yield finished.response;
  }
}
