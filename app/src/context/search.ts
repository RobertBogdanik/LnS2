import { create } from 'zustand';

type SearchModalStore = {
    isSearchOpen: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    openSearchModal: (q: string) => void;
    closeSearchModal: () => void;
};

export const useSearchModalStore = create<SearchModalStore>((set) => ({
    isSearchOpen: false,
    searchQuery: '',
    setSearchQuery: (q: string) => set({ searchQuery: q }),
    openSearchModal: (q: string) => set({ isSearchOpen: true, searchQuery: q }),
    closeSearchModal: () => set({ isSearchOpen: false, searchQuery: '' }),
}));
