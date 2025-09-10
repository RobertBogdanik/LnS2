import { create } from 'zustand';

type UserStore = {
    UsID: number;
    userName: string;
    isAdmin: boolean;
    setUser: (UsID: number, userName: string, isAdmin: boolean) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  UsID: 0,
  userName: '',
  isAdmin: false,
  setUser: (UsID: number, userName: string, isAdmin: boolean) => set({ userName, isAdmin, UsID }),
}));