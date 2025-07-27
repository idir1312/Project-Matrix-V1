import { create } from 'zustand';

type StoreState = {
  activeDomain: string
  setActiveDomain: (domain: string) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
  selectedRegion: { id: number; code: string; name: string; gdp: number; projectCount: number } | null
  setSelectedRegion: (region: StoreState['selectedRegion']) => void
}

/*
 * A simple Zustand store holds global UI state such as the active
 * domain (economy, infrastructure, etc.) and the selected year for
 * time‑series queries. Components can subscribe to these values and
 * update them through the provided setters.
 */
export default create<StoreState>((set) => ({
  activeDomain: 'economy',
  setActiveDomain: (domain: string) => set({ activeDomain: domain }),
  selectedYear: 2023,
  setSelectedYear: (year: number) => set({ selectedYear: year }),
  selectedRegion: null,
  setSelectedRegion: (region: {id: number, code: string, name: string, gdp: number, projectCount: number} | null) => set({ selectedRegion: region }),
}));