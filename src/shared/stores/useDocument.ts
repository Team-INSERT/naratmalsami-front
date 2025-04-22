import { create } from 'zustand';
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/list?skip=0&limit=100`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        },
      );

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const rawData = await response.json();
      const data = rawData.map((file: FileItem) => ({
        ...file,
        updated_at: new Date(file.updated_at.replace(' ', 'T')).toISOString(),
      }));

      set((state) =>
        state.files.length === data.length &&
        state.files.every((file, i) => file.hashed_id === data[i].hashed_id)
          ? state
          : { files: data },
      );
    } catch (error) {
      console.error('Failed to fetch files:', error);
      set({ files: [] });
    }
  },
}));
