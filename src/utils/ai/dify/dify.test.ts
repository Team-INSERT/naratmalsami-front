import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import { dify } from "./dify";
import { foreignSentenceType } from "../refineForeign";

vi.mock("axios");

describe("dify", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSentence: foreignSentenceType = {
    target_id: "p-1",
    sentence: "This is a test sentence with data.",
    foreignWord: ["data"],
    fullsentence: "This is a test sentence with data.",
  };

  it("should call axios.post with correct parameters and return parsed data", async () => {
    const mockResponse = {
      data: {
        data: {
          outputs: {
            text: 'Some text before {"data": ["자료", "정보"]} some text after',
          },
        },
      },
    };
    vi.mocked(axios.post).mockResolvedValue(mockResponse);

    const result = await dify(mockSentence);

    expect(axios.post).toHaveBeenCalledWith(
      `${import.meta.env.VITE_DIFY_ADDRESS}/workflows/run`,
      expect.any(Object),
      expect.any(Object)
    );

    expect(result.target_id).toBe("p-1");
    expect(result.refineWord).toEqual({ data: ["자료", "정보"] });
    expect(result.sentence).toBe(mockSentence.sentence);
  });

  it("should throw an error if no valid JSON is found in the response", async () => {
    const mockResponse = {
      data: {
        data: {
          outputs: {
            text: "There is no json here.",
          },
        },
      },
    };
    vi.mocked(axios.post).mockResolvedValue(mockResponse);

    await expect(dify(mockSentence)).rejects.toThrow("No valid JSON found in response");
  });

  it("should handle axios post rejection", async () => {
    const error = new Error("Network Error");
    vi.mocked(axios.post).mockRejectedValue(error);

    await expect(dify(mockSentence)).rejects.toThrow("Network Error");
  });
});
