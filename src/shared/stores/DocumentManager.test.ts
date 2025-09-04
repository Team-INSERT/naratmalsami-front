import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DocumentManager } from "./DocumentManager";
import { HtmlProcessor } from "@/utils/HtmlProcessor";
import { AiService } from "@/utils/AiService";
import { DocumentService } from "@/shared/services/DocumentService";
import deepDiff from "deep-diff";

// Mock all dependencies
vi.mock("@/utils/HtmlProcessor");
vi.mock("@/utils/AiService");
vi.mock("@/shared/services/DocumentService");
vi.mock("deep-diff", () => ({
  default: {
    diff: vi.fn(),
  },
}));

describe("DocumentManager", () => {
  beforeEach(() => {
    // Reset the static property to break the singleton behavior for tests
    (DocumentManager as any).documentService = undefined;
    vi.clearAllMocks();
  });

  it("should initialize DocumentService on first creation", () => {
    new DocumentManager();
    expect(DocumentService).toHaveBeenCalledTimes(1);
  });

  describe("handleDocumentModifications", () => {
    it("should do nothing if no differences are found", async () => {
      vi.mocked(deepDiff.diff).mockReturnValue(undefined);
      const documentManager = new DocumentManager();
      await documentManager.handleDocumentModifications("<p>test</p>");
      expect(AiService.fetchAiRefinementsLocal).not.toHaveBeenCalled();
    });

    it("should process modifications and call AI service if differences are found", async () => {
      // Arrange
      const mockDiffs = [{ kind: "E", path: [0], lhs: "a", rhs: "b" }];
      const mockModifiedElements = ["<p>b</p>"];
      const mockProcessedDoc = ["b"];

      vi.mocked(deepDiff.diff).mockReturnValue(mockDiffs as any);

      const mockProcessor = vi.mocked(HtmlProcessor.prototype);
      mockProcessor.processHtmlDocument.mockReturnValue(mockProcessedDoc);
      mockProcessor.extractModifiedElements.mockReturnValue(mockModifiedElements);

      const mockAiGenerator = async function*() { yield { target_id: '1', errors: [] }; }
      vi.mocked(AiService.fetchAiRefinementsLocal).mockReturnValue(mockAiGenerator());

      const setPrevDocSpy = vi.fn();
      const handleAiRefinementSpy = vi.fn();
      vi.spyOn(DocumentService.prototype, 'getPreviousDocuments').mockReturnValue(["a"]);
      vi.spyOn(DocumentService.prototype, 'setPreviousDocuments').mockImplementation(setPrevDocSpy);
      vi.spyOn(DocumentService.prototype, 'handleAiRefinement').mockImplementation(handleAiRefinementSpy);

      // Act
      const documentManager = new DocumentManager();
      await documentManager.handleDocumentModifications("<p>b</p>");

      // Assert
      expect(mockProcessor.extractModifiedElements).toHaveBeenCalledWith(mockDiffs, mockProcessedDoc);
      expect(setPrevDocSpy).toHaveBeenCalledWith(mockProcessedDoc);
      expect(AiService.fetchAiRefinementsLocal).toHaveBeenCalledWith(mockModifiedElements);
      expect(handleAiRefinementSpy).toHaveBeenCalled();
    });
  });

  it("should delegate subscribe to DocumentService", () => {
    const listener = () => {};
    const unsubscribe = () => {};
    const subscribeSpy = vi.spyOn(DocumentService.prototype, 'subscribe').mockReturnValue(unsubscribe);

    const documentManager = new DocumentManager();
    const result = documentManager.subscribe(listener);

    expect(subscribeSpy).toHaveBeenCalledWith(listener);
    expect(result).toBe(unsubscribe);
  });

  it("should delegate getErrorParagraphs to DocumentService", () => {
    const getErrorsSpy = vi.spyOn(DocumentService.prototype, 'getErrorParagraphs').mockReturnValue([]);

    const documentManager = new DocumentManager();
    documentManager.getErrorParagraphs();

    expect(getErrorsSpy).toHaveBeenCalled();
  });
});
