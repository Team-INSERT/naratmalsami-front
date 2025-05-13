import { findForeignWord } from "./lstm/findForeignWord";

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
  foreignWords: string[];
  fullsentence: string;
}

export async function* refineForeign(inputData: string[]) {
  const foreignSentenceList: foreignSentenceType[] = [];

  for (const html of inputData) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const content = doc.body.textContent || "";
    const target_id = doc.querySelector("[data-unique]")?.getAttribute("data-unique") as string;

    const { foreignWords, sentenceList } = await findForeignWord(content);

    for (const sentence of sentenceList) {
      const foreignInSentence = foreignWords.filter((word) => sentence.includes(word));

      if (foreignInSentence.length) {
        foreignSentenceList.push({
          target_id,
          sentence,
          foreignWords: foreignInSentence,
          fullsentence: content,
        });
      }
    }
  }

  const pending = new Set<Promise<{ response: refineResponseType }>>();

  foreignSentenceList.forEach((foreignSentence) => {
    foreignSentence.foreignWords.forEach((foreignWord) => {
      const p = fetch('https://naratmalsami.kwon5700.kr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_id: foreignSentence.target_id,
          sentence: foreignSentence.sentence,
          foreign_word: foreignWord,
          fullsentence: foreignSentence.fullsentence
        }),
      })
      .then((res) => res.json())
      .then((data) => {
        return {
          response: {
            target_id: data.target_id,
            errors: data.errors
          }
        }
      })
  
      pending.add(p);
    })
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

    console.log(finished.response)
    yield finished.response;
  }
}
