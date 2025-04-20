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
  const unicodeVal = char.slice(-1).charCodeAt(0) - "가".charCodeAt(0);
  const jongseongIndex = unicodeVal % 28;

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
