import { create } from "zustand";

interface SheetState {
  viewOpen: boolean;
  editOpen: boolean;
  selectedId: string | null;

  openView: (id: string) => void;
  openEdit: (id: string) => void;
  closeView: () => void;
  closeEdit: () => void;
  closeAll: () => void;
}

const createSheetStore = () => create<SheetState>((set) => ({
  viewOpen: false,
  editOpen: false,
  selectedId: null,

  openView: (id: string) => set({ viewOpen: true, selectedId: id }),
  openEdit: (id: string) => set({ editOpen: true, selectedId: id }),
  closeView: () => set({ viewOpen: false }),
  closeEdit: () => set({ editOpen: false }),
  closeAll: () => set({ viewOpen: false, editOpen: false, selectedId: null })
}));

export const useProspectSheetsStore = createSheetStore();
export const useLeadsBuyerStore = createSheetStore();
export const useLeadsRenterStore = createSheetStore();
export const useLeadsLandlordStore = createSheetStore();
export const useLeadsSellerStore = createSheetStore();
export const useBuyersBuyerStore = createSheetStore();
export const useBuyersRenterStore = createSheetStore();
export const useMatchesRentalStore = createSheetStore();
export const useMatchesSalesStore = createSheetStore();
export const useListingRentalStore = createSheetStore();
export const useListingSalesStore = createSheetStore();
