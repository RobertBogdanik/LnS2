import { create } from 'zustand';

type ModalStore = {
  isOpen: boolean;
  syncStep: number;
  stepProgress: number;
  openModal: () => void;
  closeModal: () => void;
  openModalAsync: () => Promise<void>;
};

export const useDeepSyncStore = create<ModalStore>((set) => ({
  isOpen: false,
  syncStep: 0,
  stepProgress: 0,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),

  openModalAsync: async () => {
    set({ isOpen: true });

    return new Promise((resolve) => {
      setTimeout(() => {
        set({ isOpen: false });
        resolve();
      }, 5000);
    });
  },
}));
