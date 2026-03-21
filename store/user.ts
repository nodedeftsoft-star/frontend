export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  brokerageName: string;
  brokeragePhoneNumber: string;
  website: string;
  phoneNumber: string;
  createdAt: string;
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the store state
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the store
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: "user-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({ user: state.user }), // only persist user data, not loading/error states
    }
  )
);

// Export selector hooks for convenience
export const useUser = () => useUserStore((state) => state.user);
export const useUserLoading = () => useUserStore((state) => state.isLoading);
export const useUserError = () => useUserStore((state) => state.error);
