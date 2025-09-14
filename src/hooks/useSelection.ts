import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SelectionState {
  departmentId: string | null
  yearId: string | null
  semesterId: string | null
  setSelection: (departmentId: string, yearId: string, semesterId: string) => void
  clearSelection: () => void
  hasSelection: () => boolean
}

export const useSelection = create<SelectionState>()(
  persist(
    (set, get) => ({
      departmentId: null,
      yearId: null,
      semesterId: null,
      setSelection: (departmentId: string, yearId: string, semesterId: string) =>
        set({ departmentId, yearId, semesterId }),
      clearSelection: () => set({ departmentId: null, yearId: null, semesterId: null }),
      hasSelection: () => {
        const { departmentId, yearId, semesterId } = get()
        return !!(departmentId && yearId && semesterId)
      },
    }),
    {
      name: 'selection-storage',
    }
  )
)