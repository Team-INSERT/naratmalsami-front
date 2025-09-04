import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { AiService } from "./AiService";
import { refineForeign } from "./ai/refineForeign";

// Mock the refineForeign dependency
vi.mock("./ai/refineForeign", () => ({
  refineForeign: vi.fn(),
}));

describe("AiService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAiRefinements", () => {
    it("should call fetchAiRefinements when VITE_USE_MOCK_AI is not 'true'", async () => {
      vi.stubEnv("VITE_USE_MOCK_AI", "false");
      const fetchSpy = vi.spyOn(AiService, "fetchAiRefinements").mockResolvedValue([]);

      await AiService.getAiRefinements([]);

      expect(fetchSpy).toHaveBeenCalled();
    });

    it("should call fetchAiRefinementsMock when VITE_USE_MOCK_AI is 'true'", async () => {
      vi.stubEnv("VITE_USE_MOCK_AI", "true");
      const mockFetchSpy = vi.spyOn(AiService, "fetchAiRefinementsMock").mockResolvedValue([]);

      await AiService.getAiRefinements([]);

      expect(mockFetchSpy).toHaveBeenCalled();
    });
  });

  describe("fetchAiRefinementsMock", () => {
    it("should return mock data based on input elements", async () => {
      const modifiedElements = ['<p data-unique="p-1">data one</p>', '<p data-unique="p-2">info two</p>'];
      const result = await AiService.fetchAiRefinementsMock(modifiedElements);

      expect(result).toHaveLength(2);
      expect(result[0].target_id).toBe("p-1");
      expect(result[0].errors[0].origin_word).toBe("data");
      expect(result[0].errors[0].refine_word).toEqual(["자료", "정보"]);
      expect(result[1].target_id).toBe("p-2");
      expect(result[1].errors[0].origin_word).toBe("info");
    });
  });

  describe("fetchAiRefinements", () => {
    beforeEach(() => {
        // Mock global fetch
        global.fetch = vi.fn();
    });

    it("should call fetch with the correct parameters and return data", async () => {
        const mockResponse = { data: "test" };
        const mockJsonPromise = Promise.resolve(mockResponse);
        const mockFetchPromise = Promise.resolve({
            json: () => mockJsonPromise,
        });
        vi.mocked(global.fetch).mockReturnValue(mockFetchPromise as Promise<Response>);

        const modifiedElements = ["<p>hello</p>"];
        const result = await AiService.fetchAiRefinements(modifiedElements);

        expect(global.fetch).toHaveBeenCalledWith(
            `${import.meta.env.VITE_AI_API_URL}/ai/refine`,
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    title: '<p data-unique="e-0">http</p>',
                    content: modifiedElements,
                }),
            })
        );
        expect(result).toEqual(mockResponse);
    });
  });

  describe("fetchAiRefinementsLocal", () => {
    it("should yield refined data from the local AI generator", async () => {
      const mockGenerator = async function* () {
        yield { target_id: "p-1", errors: [{ origin_word: "word", refine_word: ["단어"], index: 0, code: 0 }] };
        yield { target_id: "p-2", errors: [{ origin_word: "data", refine_word: ["자료"], index: 0, code: 0 }] };
      };

      vi.mocked(refineForeign).mockReturnValue(mockGenerator());

      const results = [];
      const generator = AiService.fetchAiRefinementsLocal([]);
      for await (const result of generator) {
        results.push(result);
      }

      expect(results).toHaveLength(2);
      expect(results[0].target_id).toBe("p-1");
      expect(results[0].errors[0].origin_word).toBe("word");
      expect(results[0].errors[0]).toHaveProperty("error_id"); // check that an id was added
      expect(results[1].target_id).toBe("p-2");
      expect(results[1].errors[0].origin_word).toBe("data");
      expect(results[1].errors[0]).toHaveProperty("error_id");
    });
  });
});
