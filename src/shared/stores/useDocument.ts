import { create } from "zustand";
import deepDiff from "deep-diff";
import { parseHtmlToArray } from "@/utils/parseHtmlToArray";
import axios from "axios";

interface RefineState {
  preDocument: string[];
  initDocument: (newDocument: string[]) => void;
  updateDocument: (Document: string) => void;
}

export const useDocument = create<RefineState>((set) => ({
  preDocument: [],
  initDocument: (newDocument: string[]) => set({ preDocument: newDocument }),
  updateDocument: (document: string) =>
    set((state) => {
      const newDocument = parseHtmlToArray(document);
      const difference = deepDiff.diff(state.preDocument, newDocument);
      if (difference === undefined) return state;
      console.log("Difference:", difference);
      console.log("Document:", newDocument);
      return { preDocument: newDocument };
    }),
}));

interface FileItem {
  title: string;
  updated_at: string;
  hashed_id: string;
}
interface FileStore {
  files: FileItem[];
  fetchFiles: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  fetchFiles: async () => {
    try {
      const response = await axios.get<FileItem[]>("/files/list");
      set({ files: response.data ?? [] });
    } catch (error) {
      console.error("Failed to fetch files:", error);
      set({ files: [] });
    }
  },
}));
