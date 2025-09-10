import { create } from 'zustand';

type ProductListStore = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

export const useProductListStore = create<ProductListStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
