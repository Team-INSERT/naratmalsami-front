import { describe, it, expect } from "vitest";
import translateJosa from "./translateJosa";

describe("translateJosa", () => {
  it("should return '을' for '사람' with '을/를'", () => {
    expect(translateJosa("사람", "을")).toBe("을");
    expect(translateJosa("사람", "를")).toBe("을");
  });

  it("should return '를' for '사과' with '을/를'", () => {
    expect(translateJosa("사과", "을")).toBe("를");
    expect(translateJosa("사과", "를")).toBe("를");
  });

  it("should return '이' for '사람' with '이/가'", () => {
    expect(translateJosa("사람", "이")).toBe("이");
    expect(translateJosa("사람", "가")).toBe("이");
  });

  it("should return '가' for '사과' with '이/가'", () => {
    expect(translateJosa("사과", "이")).toBe("가");
    expect(translateJosa("사과", "가")).toBe("가");
  });

  it("should return '은' for '사람' with '은/는'", () => {
    expect(translateJosa("사람", "은")).toBe("은");
    expect(translateJosa("사람", "는")).toBe("은");
  });

  it("should return '는' for '사과' with '은/는'", () => {
    expect(translateJosa("사과", "은")).toBe("는");
    expect(translateJosa("사과", "는")).toBe("는");
  });

  it("should return '으로' for '사람' with '으로/로'", () => {
    expect(translateJosa("사람", "으로")).toBe("으로");
    expect(translateJosa("사람", "로")).toBe("으로");
  });

  it("should return '로' for '사과' with '으로/로'", () => {
    expect(translateJosa("사과", "으로")).toBe("로");
    expect(translateJosa("사과", "로")).toBe("로");
  });

  it("should return '로' for '서울' with '으로/로'", () => {
    expect(translateJosa("서울", "으로")).toBe("로");
    expect(translateJosa("서울", "로")).toBe("로");
  });

  it("should return null for josa not in the rule", () => {
    expect(translateJosa("사람", "에게")).toBe(null);
  });

  it("should handle empty string as previousWord", () => {
    // Empty string should be treated as no 받침
    expect(translateJosa("", "을")).toBe("를");
  });

  it("should handle non-Korean words", () => {
    // Non-Korean words are treated as having no 받침
    expect(translateJosa("Apple", "을")).toBe("를");
    expect(translateJosa("Banana", "은")).toBe("는");
  });
});
