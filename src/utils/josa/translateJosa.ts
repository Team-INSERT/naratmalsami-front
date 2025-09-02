import rawRule from "./rule.json";

interface JosaRule {
  [josa: string]: {
    [jongseong: string]: string;
  };
}

const rule: JosaRule = rawRule as JosaRule;

enum JongseongResult {
  받침있음,
  받침ㄹ,
  받침없음,
}

const jongseongName = {
  [JongseongResult.받침있음]: "받침있음",
  [JongseongResult.받침ㄹ]: "받침ㄹ",
  [JongseongResult.받침없음]: "받침없음",
};

function getJongseong(char: string): JongseongResult {
  if (!char) return JongseongResult.받침없음; // Handle empty string

  const lastChar = char.slice(-1);
  const unicodeVal = lastChar.charCodeAt(0);

  if (unicodeVal < "가".charCodeAt(0) || unicodeVal > "힣".charCodeAt(0)) {
    // Not a Korean syllable, assume no 받침
    // A more sophisticated approach might check the last letter of the English word
    // but for josa, this is a reasonable default.
    return JongseongResult.받침없음;
  }

  const jongseongIndex = (unicodeVal - "가".charCodeAt(0)) % 28;

  if (jongseongIndex === 0) return JongseongResult.받침없음;
  if (jongseongIndex === 8) return JongseongResult.받침ㄹ;
  return JongseongResult.받침있음;
}


export default function translateJosa(
  previousWord: string,
  josa: string,
): string | null {
  if (!(josa in rule)) return null;

  const jongseong = getJongseong(previousWord);
  return rule[josa][jongseongName[jongseong]] || null;
}
