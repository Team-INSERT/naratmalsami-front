import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { findForeignWord } from "./findForeignWord";
import { analyzeMorpheme } from "./analyzeMorpheme";
import * as tf from "@tensorflow/tfjs";

// Mock dependencies
vi.mock("./analyzeMorpheme");

// Mock TensorFlow.js
const mockTensor = {
  arraySync: vi.fn(),
  expandDims: vi.fn().mockReturnThis(),
  slice: vi.fn().mockReturnThis(),
  shape: [10], // a default shape
};

const mockModel = {
  predict: vi.fn(() => mockTensor),
};

vi.mock("@tensorflow/tfjs", () => ({
  loadLayersModel: vi.fn(() => Promise.resolve(mockModel)),
  tensor1d: vi.fn(() => mockTensor),
  zeros: vi.fn(() => mockTensor),
  concat: vi.fn(() => mockTensor),
}));


describe("findForeignWord", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Re-mock loadLayersModel as it's a promise and might be cleared
    vi.mocked(tf.loadLayersModel).mockResolvedValue(mockModel);
  });

  it("should identify foreign words based on morpheme type 'SL'", async () => {
    vi.mocked(analyzeMorpheme).mockResolvedValue({
      morphemeList: [{ lemma: "apple", type: "SL" }],
      sentenceList: ["This is an apple."],
    });

    const { foreignWords, sentenceList } = await findForeignWord("text");

    expect(foreignWords).toEqual(["apple"]);
    expect(sentenceList).toEqual(["This is an apple."]);
    expect(mockModel.predict).not.toHaveBeenCalled();
  });

  it("should identify foreign words based on model prediction (>= 0.4)", async () => {
    vi.mocked(analyzeMorpheme).mockResolvedValue({
      morphemeList: [{ lemma: "데이터", type: "NNG" }],
      sentenceList: ["데이터를 처리합니다."],
    });
    vi.mocked(mockTensor.arraySync).mockReturnValue([[0.5]]); // High score

    const { foreignWords } = await findForeignWord("text");

    expect(mockModel.predict).toHaveBeenCalled();
    expect(foreignWords).toContain("데이터");
  });

  it("should not identify a word as foreign if prediction is < 0.4", async () => {
    vi.mocked(analyzeMorpheme).mockResolvedValue({
      morphemeList: [{ lemma: "사과", type: "NNG" }],
      sentenceList: ["사과를 먹는다."],
    });
    vi.mocked(mockTensor.arraySync).mockReturnValue([[0.3]]); // Low score

    const { foreignWords } = await findForeignWord("text");

    expect(mockModel.predict).toHaveBeenCalled();
    expect(foreignWords).not.toContain("사과");
  });

  it("should handle a mix of SL, high-score, and low-score words", async () => {
    vi.mocked(analyzeMorpheme).mockResolvedValue({
      morphemeList: [
        { lemma: "computer", type: "SL" },
        { lemma: "모델", type: "NNG" }, // Will get high score
        { lemma: "한국어", type: "NNP" }, // Will get low score
      ],
      sentenceList: ["computer 모델은 한국어입니다."],
    });

    // Mock predictions for the two words that go through the model
    vi.mocked(mockTensor.arraySync)
      .mockReturnValueOnce([[0.8]]) // for '모델'
      .mockReturnValueOnce([[0.1]]); // for '한국어'

    const { foreignWords } = await findForeignWord("text");

    expect(foreignWords).toHaveLength(2);
    expect(foreignWords).toContain("computer");
    expect(foreignWords).toContain("모델");
    expect(foreignWords).not.toContain("한국어");
  });
});
