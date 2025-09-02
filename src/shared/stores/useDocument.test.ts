import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useFileStore } from "./useDocument";
import { act } from "@testing-library/react";

describe("useFileStore", () => {
  const initialState = useFileStore.getState();

  beforeEach(() => {
    // Reset store to initial state before each test
    useFileStore.setState(initialState);
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch files and update the store", async () => {
    const mockFiles = [
      { title: "file1", updated_at: "2024-01-01 10:00:00", hashed_id: "1" },
      { title: "file2", updated_at: "2024-01-02 11:00:00", hashed_id: "2" },
    ];
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockFiles),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

    // Using act to ensure state updates are processed
    await act(async () => {
      await useFileStore.getState().fetchFiles();
    });

    const state = useFileStore.getState();
    expect(state.files).toHaveLength(2);
    expect(state.files[0].title).toBe("file1");
    // Check if date was correctly transformed
    expect(state.files[0].updated_at).toBe(new Date("2024-01-01T10:00:00").toISOString());
  });

  it("should handle fetch errors and set files to an empty array", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network Error"));

    await act(async () => {
      await useFileStore.getState().fetchFiles();
    });

    const state = useFileStore.getState();
    expect(state.files).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should not update state if fetched data is the same", async () => {
    const mockFiles = [{ title: "file1", updated_at: "2024-01-01 10:00:00", hashed_id: "1" }];
    const mockResponse = { ok: true, json: () => Promise.resolve(mockFiles) };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

    // Initial fetch
    await act(async () => {
      await useFileStore.getState().fetchFiles();
    });

    const stateAfterFirstFetch = useFileStore.getState();

    // Second fetch with the same data
    await act(async () => {
      await useFileStore.getState().fetchFiles();
    });

    const stateAfterSecondFetch = useFileStore.getState();

    // The object reference should be the same if no update happened
    expect(stateAfterFirstFetch.files).toBe(stateAfterSecondFetch.files);
  });
});
