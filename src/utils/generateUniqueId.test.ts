import { describe, it, expect } from "vitest";
import generateUniqueId, { Prefix } from "./generateUniqueId";

describe("generateUniqueId", () => {
  it("should generate an ID with the correct prefix", () => {
    const id = generateUniqueId(Prefix.ERROR);
    expect(id.startsWith(Prefix.ERROR)).toBe(true);
  });

  it("should generate a unique ID each time", () => {
    const id1 = generateUniqueId(Prefix.UNIQUE);
    const id2 = generateUniqueId(Prefix.UNIQUE);
    expect(id1).not.toBe(id2);
  });

  it("should generate an ID of the correct length", () => {
    const prefix = Prefix.PARAGRAPH_ERROR;
    const id = generateUniqueId(prefix);
    // The random part is 9 characters long
    const expectedLength = prefix.length + 9;
    expect(id.length).toBe(expectedLength);
  });

  it("should not contain two consecutive identical random strings", () => {
    // This is highly unlikely, but let's test for it
    const id1 = generateUniqueId(Prefix.UNIQUE);
    const id2 = generateUniqueId(Prefix.UNIQUE);
    const randomPart1 = id1.substring(Prefix.UNIQUE.length);
    const randomPart2 = id2.substring(Prefix.UNIQUE.length);
    expect(randomPart1).not.toBe(randomPart2);
  });
});
