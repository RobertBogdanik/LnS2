import { create } from 'zustand';

type ProductListStore = {
  isProductCardOpen: boolean;
  ProductCardTowID: number;
  openProductCard: (TowID: number) => void;
  closeProductCardModal: () => void;
};

export const useProductCardStore = create<ProductListStore>((set) => ({
  isProductCardOpen: false,
  ProductCardTowID: -1,
  openProductCard: (ProductCardTowID) => set({ isProductCardOpen: true, ProductCardTowID }),
  closeProductCardModal: () => set({ isProductCardOpen: false, ProductCardTowID: -1 }),
}));
