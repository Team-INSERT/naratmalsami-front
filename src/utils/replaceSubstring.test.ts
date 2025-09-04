import { describe, it, expect } from "vitest";
import replaceSubstring from "./replaceSubstring";

describe("replaceSubstring", () => {
  it("should replace a substring in the middle", () => {
    const str = "Hello, world!";
    const result = replaceSubstring(str, 7, 12, "people");
    expect(result).toBe("Hello, people!");
  });

  it("should replace at the beginning of the string", () => {
    const str = "Hello, world!";
    const result = replaceSubstring(str, 0, 5, "Hi");
    expect(result).toBe("Hi, world!");
  });

  it("should replace at the end of the string", () => {
    const str = "Hello, world!";
    const result = replaceSubstring(str, 7, 13, "people");
    expect(result).toBe("Hello, people");
  });

  it("should replace the entire string", () => {
    const str = "Hello, world!";
    const result = replaceSubstring(str, 0, str.length, "Hi");
    expect(result).toBe("Hi");
  });

  it("should insert a string without deleting", () => {
    const str = "Hello, world!";
    const result = replaceSubstring(str, 7, 7, "beautiful ");
    expect(result).toBe("Hello, beautiful world!");
  });

  it("should handle an empty original string", () => {
    const str = "";
    const result = replaceSubstring(str, 0, 0, "new");
    expect(result).toBe("new");
  });

  it("should handle an empty replacement string", () => {
    const str = "Hello, world!";
    const result = replaceSubstring(str, 5, 13, "");
    expect(result).toBe("Hello");
  });

  it("should handle n > m by inserting at n", () => {
    const str = "Hello, world!";
    // str.substring(5, 2) would be "llo"
    // but the function is str.substring(0, n) + t + str.substring(m)
    // so it would be str.substring(0, 5) + "t" + str.substring(2)
    // "Hello" + "inserted" + "llo, world!"
    // This seems like a bug in the original function. A robust implementation
    // would probably swap n and m if n > m.
    // The test will reflect the actual behavior.
    const result = replaceSubstring(str, 5, 2, "inserted");
    expect(result).toBe("Helloinsertedllo, world!");
  });
});
