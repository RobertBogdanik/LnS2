import { create } from 'zustand';

type CountStore = {
    closed_at: string | null;
    CountID: number;
    is_active: boolean;
    name: string;
    open_at: string | null;
    setCount: (closed_at: string | null, CountID: number, is_active: boolean, name: string, open_at: string | null) => void;
};

export const useCountStore = create<CountStore>((set) => ({
  closed_at: null,
  CountID: 0,
  is_active: false,
  name: "",
  open_at: null,
  setCount: (closed_at: string | null, CountID: number, is_active: boolean, name: string, open_at: string | null) => set({ closed_at, CountID, is_active, name, open_at }),
}));