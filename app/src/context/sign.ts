import { create } from 'zustand';

type SignSheetStore = {
  isSignSheetStoreOpen: boolean;
  sheetId: string | null;
  openSignSheetStoreModal: (id: string) => void;
  closeSignSheetStoreModal: () => void;
};

export const useSignSheetStore = create<SignSheetStore>((set) => ({
  isSignSheetStoreOpen: false,
  sheetId: null,
  openSignSheetStoreModal: (id: string) => set({ isSignSheetStoreOpen: true, sheetId: id }),
  closeSignSheetStoreModal: () => set({ isSignSheetStoreOpen: false, sheetId: null }),
}));
