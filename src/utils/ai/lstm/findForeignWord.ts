import { analyzeMorpheme } from './analyzeMorpheme';
import * as Hangul from 'hangul-js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import { morphemeListType } from './analyzeMorpheme';

interface responseType {
  foreignWords: string[],
  sentenceList: string[]
}

function padSequences(tensor: tf.Tensor) {
  const padLength = 25 - tensor.shape[0];
  if (padLength > 0) {
    const padValue = tf.zeros([padLength]);
    return tf.concat([tensor, padValue], 0);
  }
  return tensor.slice([0], [25]);
}

const tokenDict: Record<string, number> = {
  'ㄱ': 1, 'ㄲ': 2, 'ㄳ': 3, 'ㄴ': 4, 'ㄵ': 5, 'ㄶ': 6, 'ㄷ': 7, 'ㄸ': 8, 'ㄹ': 9, 'ㄺ': 10, 
  'ㄻ': 11, 'ㄼ': 12, 'ㄽ': 13, 'ㄾ': 14, 'ㄿ': 15, 'ㅀ': 16, 'ㅁ': 17, 'ㅂ': 18, 'ㅃ': 19, 'ㅄ': 20, 
  'ㅅ': 21, 'ㅆ': 22, 'ㅇ': 23, 'ㅈ': 24, 'ㅉ': 25, 'ㅊ': 26, 'ㅋ': 27, 'ㅌ': 28, 'ㅍ': 29, 'ㅎ': 30, 
  'ㅏ': 31, 'ㅐ': 32, 'ㅑ': 33, 'ㅒ': 34, 'ㅓ': 35, 'ㅔ': 36, 'ㅕ': 37, 'ㅖ': 38, 'ㅗ': 39, 'ㅘ': 40, 
  'ㅙ': 41, 'ㅚ': 42, 'ㅛ': 43, 'ㅜ': 44, 'ㅝ': 45, 'ㅞ': 46, 'ㅟ': 47, 'ㅠ': 48, 'ㅡ': 49, 'ㅢ': 50, 
  'ㅣ': 51, ' ': 52, 'a': 53, 'b': 54, 'c': 55, 'd': 56, 'e': 57, 'f': 58, 'g': 59, 'h': 60, 'i': 61, 'j': 62, 
  'k': 63, 'l': 64, 'm': 65, 'n': 66, 'o': 67, 'p': 68, 'q': 69, 'r': 70, 's': 71, 't': 72, 
  'u': 73, 'v': 74, 'w': 75, 'x': 76, 'y': 77, 'z': 78, '.': 79
}

export const findForeignWord = async (parsedText: string): Promise<responseType> => {
  const model = await tf.loadLayersModel('src/ai/lstm/tsfj/model.json');
  
  const { morphemeList, sentenceList } = await analyzeMorpheme(parsedText);
  const foreignWords = new Set<string>();

  morphemeList.forEach(({lemma, type}: morphemeListType) => {
    if (type === 'SL') {
      foreignWords.add(lemma);
      return;
    }

    const token = Hangul.disassemble(lemma).map((jamo) => tokenDict[jamo] || 80);

    const tokenTensor = tf.tensor1d(token, 'int32');
    const paddedToken = padSequences(tokenTensor);

    const prediction = model.predict(paddedToken.expandDims(0).expandDims(-1)) as tf.Tensor;
    const predictionData = prediction.arraySync() as number[][];

    if (predictionData[0][0] >= 0.4) {
      foreignWords.add(lemma)
    }
  })

  return { foreignWords: [...foreignWords], sentenceList };
}