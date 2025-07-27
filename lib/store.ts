import { create } from 'zustand';

/*
 * A simple Zustand store holds global UI state such as the active
 * domain (economy, infrastructure, etc.) and the selected year for
 * time‑series queries. Components can subscribe to these values and
 * update them through the provided setters.
 */
export default create((set) => ({
  activeDomain: 'economy',
  setActiveDomain: (domain: string) => set({ activeDomain: domain }),
  selectedYear: 2023,
  setSelectedYear: (year: number) => set({ selectedYear: year }),
}));