import { create } from 'zustand';

type UserStore = {
    UsID: number;
    userName: string;
    isAdmin: boolean;
    defaultPiku: string;
    setUser: (UsID: number, userName: string, isAdmin: boolean, defaultPiku: string) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  UsID: 0,
  userName: '',
  isAdmin: false,
  defaultPiku: '',
  setUser: (UsID: number, userName: string, isAdmin: boolean, defaultPiku: string) => set({ userName, isAdmin, UsID, defaultPiku }),
}));