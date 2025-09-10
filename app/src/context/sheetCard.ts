import { create } from 'zustand';

type SheetCardStore = {
  isOpen: boolean;
  sheetId: number | null;
  lastChange: Date | null;
  setLastChange: (date: Date) => void;
  openModal: (id: number) => void;
  closeModal: () => void;
};

export const useSheetCardStore = create<SheetCardStore>((set) => ({
  isOpen: false,
  sheetId: null,
  lastChange: null,
  setLastChange: (date: Date) => set({ lastChange: date }),
  openModal: (id: number) => set({ isOpen: true, sheetId: id }),
  closeModal: () => set({ isOpen: false, sheetId: null }),
}));
