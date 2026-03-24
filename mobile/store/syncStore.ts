import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncStore {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  setStatus: (s: SyncStatus) => void;
  setPending: (n: number) => void;
  setLastSynced: (d: Date) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: "idle",
  pendingCount: 0,
  lastSyncedAt: null,
  setStatus: (status) => set({ status }),
  setPending: (pendingCount) => set({ pendingCount }),
  setLastSynced: (lastSyncedAt) => set({ lastSyncedAt }),
}));
