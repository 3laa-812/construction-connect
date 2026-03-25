import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const KEY = "active_project_local_id";

type ProjectState = {
  activeProjectId: string | null;
  hydrated: boolean;
  setActiveProjectId: (id: string | null) => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  hydrated: false,
  setActiveProjectId: async (id) => {
    set({ activeProjectId: id });
    try {
      if (id) {
        await SecureStore.setItemAsync(KEY, id);
      } else {
        await SecureStore.deleteItemAsync(KEY);
      }
    } catch {
      /* secure store unavailable on some web builds */
    }
  },
  hydrateFromStorage: async () => {
    if (get().hydrated) return;
    try {
      const id = await SecureStore.getItemAsync(KEY);
      set({ activeProjectId: id, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
