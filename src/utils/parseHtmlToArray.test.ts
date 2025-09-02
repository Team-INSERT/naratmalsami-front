import { describe, it, expect } from "vitest";
import { parseHtmlToArray } from "./parseHtmlToArray";

describe("parseHtmlToArray", () => {
  it("should parse simple p tags", () => {
    const html = "<p>one</p><p>two</p>";
    const result = parseHtmlToArray(html);
    expect(result).toEqual(["<p>one</p>", "<p>two</p>"]);
  });

  it("should handle nested elements, returning only direct children", () => {
    const html = "<div><p>one</p></div><p>two</p>";
    const result = parseHtmlToArray(html);
    expect(result).toEqual(["<div><p>one</p></div>", "<p>two</p>"]);
  });

  it("should handle an empty html string", () => {
    const html = "";
    const result = parseHtmlToArray(html);
    expect(result).toEqual([]);
  });

  it("should handle html with no body tag", () => {
    const html = "<head><title>test</title></head><span>hello</span>";
    const result = parseHtmlToArray(html);
    // DOMParser will create a body tag and put the span inside it.
    expect(result).toEqual(["<span>hello</span>"]);
  });

  it("should handle only text nodes in body", () => {
    const html = "just text";
    const result = parseHtmlToArray(html);
    // "just text" will be a text node, not an element child of body.
    expect(result).toEqual([]);
  });

  it("should handle a mix of elements and text nodes", () => {
    const html = "<p>one</p>some text<p>two</p>";
    const result = parseHtmlToArray(html);
    expect(result).toEqual(["<p>one</p>", "<p>two</p>"]);
  });
});
