import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import { analyzeMorpheme } from "./analyzeMorpheme";

vi.mock("axios");

describe("analyzeMorpheme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockEtriApiResponse = {
    data: {
      return_object: {
        sentence: [
          {
            id: 1,
            text: "이것은 text이고 data입니다.",
            morp: [
              { lemma: "이것", type: "NP" },
              { lemma: "은", type: "JX" },
              { lemma: "text", type: "SL" }, // Foreign Language
              { lemma: "이고", type: "JC" },
              { lemma: "data", type: "SL" }, // Foreign Language
              { lemma: "입니다", type: "VCP+EF" },
              { lemma: "서울", type: "NNP" }, // Proper Noun
              { lemma: "사과", type: "NNG" }, // Common Noun
            ],
          },
        ],
      },
    },
  };

  it("should call ETRI API and process the response correctly", async () => {
    vi.mocked(axios.post).mockResolvedValue(mockEtriApiResponse);

    const result = await analyzeMorpheme("some text");

    expect(axios.post).toHaveBeenCalledWith(
      import.meta.env.VITE_ETRI_ADDRESS,
      { argument: { analysis_code: "morp", text: "some text" } },
      { headers: { "Authorization": import.meta.env.VITE_ETRI_KEY, "Content-Type": "application/json" } }
    );

    expect(result.sentenceList).toEqual(["이것은 text이고 data입니다."]);
    expect(result.morphemeList).toHaveLength(4);
    expect(result.morphemeList).toEqual([
      { lemma: "text", type: "SL" },
      { lemma: "data", type: "SL" },
      { lemma: "서울", type: "NNP" },
      { lemma: "사과", type: "NNG" },
    ]);
  });

  it("should handle API errors gracefully and return empty arrays", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(axios.post).mockRejectedValue(new Error("API Error"));

    const result = await analyzeMorpheme("some text");

    expect(result.morphemeList).toEqual([]);
    expect(result.sentenceList).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should handle empty sentence response from API", async () => {
    const emptyResponse = {
      data: {
        return_object: {
          sentence: [],
        },
      },
    };
    vi.mocked(axios.post).mockResolvedValue(emptyResponse);

    const result = await analyzeMorpheme("some text");

    expect(result.morphemeList).toEqual([]);
    expect(result.sentenceList).toEqual([]);
  });
});
