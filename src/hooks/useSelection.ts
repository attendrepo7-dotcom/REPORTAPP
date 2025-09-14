import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SelectionState {
  departmentId: string | null
  yearId: string | null
  semesterId: string | null
  departmentCode: string | null
  yearValue: string | null
  semNumber: string | null
  setSelection: (
    departmentId: string,
    yearId: string,
    semesterId: string,
    departmentCode: string,
    yearValue: string,
    semNumber: string
  ) => void
  clearSelection: () => void
  hasSelection: () => boolean
}

export const useSelection = create<SelectionState>()(
  persist(
    (set, get) => ({
      departmentId: null,
      yearId: null,
      semesterId: null,
      departmentCode: null,
      yearValue: null,
      semNumber: null,
      setSelection: (
        departmentId: string,
        yearId: string,
        semesterId: string,
        departmentCode: string,
        yearValue: string,
        semNumber: string
      ) => set({ departmentId, yearId, semesterId, departmentCode, yearValue, semNumber }),
      clearSelection: () => set({ departmentId: null, yearId: null, semesterId: null, departmentCode: null, yearValue: null, semNumber: null }),
      hasSelection: () => {
        const { departmentId, yearId, semesterId, departmentCode, yearValue, semNumber } = get();
        return !!(departmentId && yearId && semesterId && departmentCode && yearValue && semNumber);
      },
    }),
    {
      name: 'selection-storage',
    }
  )
)