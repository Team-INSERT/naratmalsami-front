import { describe, it, expect, vi, afterEach } from "vitest";
import { refineForeign } from "./refineForeign";
import { findForeignWord } from "./lstm/findForeignWord";
import { dify } from "./dify/dify";

// Mock dependencies
vi.mock("./lstm/findForeignWord", () => ({
  findForeignWord: vi.fn(),
}));

vi.mock("./dify/dify", () => ({
  dify: vi.fn(),
}));

describe("refineForeign", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should yield correctly formatted refinement data", async () => {
    const inputHtml = ['<p data-unique="p-1">This is some data.</p>'];

    vi.mocked(findForeignWord).mockResolvedValue({
      foreignWords: ["data"],
      sentenceList: ["This is some data."],
    });

    vi.mocked(dify).mockResolvedValue({
      target_id: "p-1",
      refineWord: { data: ["자료", "정보"] },
    });

    const generator = refineForeign(inputHtml);
    const result = await generator.next();

    expect(result.done).toBe(false);
    expect(result.value.target_id).toBe("p-1");
    expect(result.value.errors).toHaveLength(1);
    expect(result.value.errors[0].origin_word).toBe("data");
    expect(result.value.errors[0].refine_word).toEqual(["자료", "정보"]);
    expect(result.value.errors[0].index).toBe(13); // "This is some ".length
  });

  it("should handle multiple concurrent requests", async () => {
    const inputHtml = [
      '<p data-unique="p-1">This is data.</p>',
      '<p data-unique="p-2">This is an apple.</p>',
    ];

    vi.mocked(findForeignWord)
      .mockResolvedValueOnce({ foreignWords: ["data"], sentenceList: ["This is data."] })
      .mockResolvedValueOnce({ foreignWords: ["apple"], sentenceList: ["This is an apple."] });

    vi.mocked(dify)
      .mockResolvedValueOnce({ target_id: "p-1", refineWord: { data: ["자료"] } })
      .mockResolvedValueOnce({ target_id: "p-2", refineWord: { apple: ["사과"] } });

    const generator = refineForeign(inputHtml);
    const results = [];
    for await (const value of generator) {
      results.push(value);
    }

    expect(results).toHaveLength(2);
    // Note: The order is not guaranteed due to Promise.race
    const result1 = results.find(r => r.target_id === 'p-1');
    const result2 = results.find(r => r.target_id === 'p-2');

    expect(result1).toBeDefined();
    expect(result1?.errors[0].origin_word).toBe("data");
    expect(result2).toBeDefined();
    expect(result2?.errors[0].origin_word).toBe("apple");
  });

  it("should yield nothing if no foreign words are found", async () => {
    const inputHtml = ['<p data-unique="p-1">이것은 순수 한글입니다.</p>'];

    vi.mocked(findForeignWord).mockResolvedValue({
      foreignWords: [],
      sentenceList: ["이것은 순수 한글입니다."],
    });

    const generator = refineForeign(inputHtml);
    const result = await generator.next();

    expect(vi.mocked(dify)).not.toHaveBeenCalled();
    expect(result.done).toBe(true);
  });

  it("should filter out errors for words not found in the full sentence", async () => {
    const inputHtml = ['<p data-unique="p-1">This sentence has a word.</p>'];

    vi.mocked(findForeignWord).mockResolvedValue({
      foreignWords: ["word"],
      sentenceList: ["This sentence has a word."],
    });

    vi.mocked(dify).mockResolvedValue({
      target_id: "p-1",
      refineWord: { word: ["단어"], notfound: ["없는단어"] }, // 'notfound' is not in the sentence
    });

    const generator = refineForeign(inputHtml);
    const result = await generator.next();

    expect(result.value.errors).toHaveLength(1);
    expect(result.value.errors[0].origin_word).toBe("word");
  });
});
