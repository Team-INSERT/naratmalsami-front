import { describe, it, expect } from "vitest";
import { HtmlProcessor } from "./HtmlProcessor";
import { diff, Diff } from "deep-diff";

describe("HtmlProcessor", () => {
  describe("prepareDiff", () => {
    it("should strip html tags and trim strings", () => {
      const doc = ["<p>Hello</p>", "  <b>World</b>  "];
      const result = HtmlProcessor.prepareDiff(doc);
      expect(result).toEqual(["Hello", "World"]);
    });

    it("should handle strings with no html tags", () => {
      const doc = ["Hello", "World"];
      const result = HtmlProcessor.prepareDiff(doc);
      expect(result).toEqual(["Hello", "World"]);
    });

    it("should handle strings that become empty", () => {
      const doc = ["<p></p>", "<b> </b>"];
      const result = HtmlProcessor.prepareDiff(doc);
      expect(result).toEqual(["", ""]);
    });

    it("should handle an empty array", () => {
      const doc: string[] = [];
      const result = HtmlProcessor.prepareDiff(doc);
      expect(result).toEqual([]);
    });
  });

  describe("processHtmlDocument", () => {
    const processor = new HtmlProcessor();

    it("should filter out elements with &nbsp;", () => {
      const html = "<p>hello</p><p>&nbsp;</p>";
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<p>hello</p>"]);
    });

    it("should filter out elements with comments", () => {
      const html = "<p>hello</p><p><!-- comment --></p>";
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<p>hello</p>"]);
    });

    it("should filter out empty elements", () => {
      const html = "<p>hello</p><p></p>";
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<p>hello</p>"]);
    });

    it("should filter out elements with only whitespace content", () => {
      const html = "<p>hello</p><p>   </p>";
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<p>hello</p>"]);
    });

    it("should filter out disallowed html tags", () => {
      const html = "<p>hello</p><script>alert('xss')</script>";
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<p>hello</p>"]);
    });

    it("should filter out br tags", () => {
      const html = "<p>hello</p><br>";
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<p>hello</p>"]);
    });

    it("should process a complex document correctly", () => {
      const html = `
        <h1>Title</h1>
        <p>Some text.</p>
        <p>&nbsp;</p>
        <br>
        <div>Not allowed</div>
        <p>More text.</p>
        <!-- a comment -->
      `;
      const result = processor.processHtmlDocument(html);
      expect(result).toEqual(["<h1>Title</h1>", "<p>Some text.</p>", "<p>More text.</p>"]);
    });
  });

  describe("extractModifiedElements", () => {
    const processor = new HtmlProcessor();
    const oldDoc = ["a", "b", "c"];
    const newDoc = ["a", "d", "e"];
    const differences = diff(oldDoc, newDoc) as Diff<string[]>[];

    it("should extract modified and new elements", () => {
      // differences will be:
      // { kind: 'E', path: [ 1 ], lhs: 'b', rhs: 'd' }
      // { kind: 'E', path: [ 2 ], lhs: 'c', rhs: 'e' }
      const result = processor.extractModifiedElements(differences, newDoc);
      expect(result).toEqual(["d", "e"]);
    });

    it("should handle array additions", () => {
      const docWithAddition = ["a", "b", "c", "f"];
      const diffs = diff(oldDoc, docWithAddition) as Diff<string[]>[];
      // diffs will be:
      // { kind: 'A', path: undefined, index: 3, item: { kind: 'N', rhs: 'f' } }
      const result = processor.extractModifiedElements(diffs, docWithAddition);
      expect(result).toEqual(["f"]);
    });

    it("should handle no differences", () => {
      const result = processor.extractModifiedElements([], newDoc);
      expect(result).toEqual([]);
    });

    it("should handle complex diffs", () => {
        const oldComplex = ["a", "b", "c", "d"];
        const newComplex = ["x", "b", "y", "z", "w"];
        const complexDiffs = diff(oldComplex, newComplex) as Diff<string[]>[];
        const result = processor.extractModifiedElements(complexDiffs, newComplex);
        expect(result).toEqual(["x", "y", "z", "w"]);
    });
  });
});
