import { describe, it, expect, beforeEach, afterEach } from "vitest";
import getSurroundingWordsByOriginId from "./getSurroundingWordsByOriginId";

describe("getSurroundingWordsByOriginId", () => {
  beforeEach(() => {
    // Create the editor and paragraph structure for tests
    const editor = document.createElement("div");
    editor.className = "ck-content";
    document.body.appendChild(editor);
  });

  afterEach(() => {
    // Clean up the DOM after each test
    const editor = document.querySelector(".ck-content");
    if (editor) {
      document.body.removeChild(editor);
    }
  });

  const setupDOM = (html: string, targetId: string) => {
    const editor = document.querySelector(".ck-content")!;
    const p = document.createElement("p");
    p.dataset.unique = targetId;
    p.innerHTML = html;
    editor.appendChild(p);
  };

  it("should return empty arrays if targetId is not found", () => {
    setupDOM("some html", "p-1");
    const result = getSurroundingWordsByOriginId("p-2", "span-1", "word");
    expect(result).toEqual({ before: [], after: [] });
  });

  it("should return empty arrays if originId is not found", () => {
    setupDOM('some <span originid="span-2">word</span>', "p-1");
    const result = getSurroundingWordsByOriginId("p-1", "span-1", "word");
    expect(result).toEqual({ before: [], after: [] });
  });

  it("should extract surrounding words correctly", () => {
    const html = `word1 word2 word3 <span originid="span-1">word</span> word5 word6 word7`;
    setupDOM(html, "p-1");
    const result = getSurroundingWordsByOriginId("p-1", "span-1", "word", false, 3);
    expect(result.before).toEqual(["word1", "word2", "word3"]);
    expect(result.after).toEqual(["word5", "word6", "word7"]);
  });

  it("should handle fewer words than count", () => {
    const html = `word1 <span originid="span-1">word</span> word2`;
    setupDOM(html, "p-1");
    const result = getSurroundingWordsByOriginId("p-1", "span-1", "word", false, 3);
    expect(result.before).toEqual(["word1"]);
    expect(result.after).toEqual(["word2"]);
  });

  describe("with josa handling", () => {
    it("should identify and translate josa", () => {
      // '단어' (no 받침) + '를' -> '사람' (받침) + '을'
      const html = `이것은 <span originid="span-1">단어</span>를 테스트합니다.`;
      setupDOM(html, "p-1");
      const result = getSurroundingWordsByOriginId("p-1", "span-1", "사람", true, 3);

      expect(result.before).toEqual(["이것은"]);
      expect(result.after).toEqual(["테스트합니다."]); // '를' is removed
      expect(result.josaDetail?.beforeJosa).toBe("를");
      expect(result.josaDetail?.afterJosa).toBe("을");
    });

    it("should handle josa at the end of the sentence", () => {
      const html = `나는 <span originid="span-1">사과</span>를`;
      setupDOM(html, "p-1");
      const result = getSurroundingWordsByOriginId("p-1", "span-1", "포도", true, 3);

      expect(result.before).toEqual(["나는"]);
      expect(result.after).toEqual([]); // '를' is removed
      expect(result.josaDetail?.beforeJosa).toBe("를");
      expect(result.josaDetail?.afterJosa).toBe("를");
    });

    it("should not remove josa if it does not need to be changed", () => {
      const html = `나는 <span originid="span-1">사과</span>를 먹는다`;
      setupDOM(html, "p-1");
      const result = getSurroundingWordsByOriginId("p-1", "span-1", "포도", true, 3);

      expect(result.before).toEqual(["나는"]);
      expect(result.after).toEqual(["먹는다"]);
      expect(result.josaDetail?.beforeJosa).toBe("를");
      expect(result.josaDetail?.afterJosa).toBe("를");
    });
  });
});
