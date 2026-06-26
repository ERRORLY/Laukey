import { create } from "zustand";

interface AppState {
  masterKey: string;
  setMasterKey: (key: string) => void;
  isVerified: boolean;
  setVerified: (verified: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  masterKey: "",
  setMasterKey: (key) => set({ masterKey: key }),
  isVerified: false,
  setVerified: (verified) => set({ isVerified: verified }),
}));
