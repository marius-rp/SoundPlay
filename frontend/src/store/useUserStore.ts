import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type IUser } from "../interface/IUser"

interface UserState {
  user: IUser | null
  setUser: (user: IUser | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),
      
      clearUser: () => set({ user: null }),
    }),
    {
      name: "soundplay-user-storage",
    }
  )
)