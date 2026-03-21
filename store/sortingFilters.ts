import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SortingState } from "@tanstack/react-table";

// Define the filters for each table
export interface TableFilters {
  sorting: SortingState;
  statusFilter: string;
  statusFilters: string[]; // Array-based status filter for multi-select
  typeFilter: string[];
  stageFilter: string;
  // Add more filters as needed
}

// Define the complete state
interface SortingFiltersState {
  filters: {
    leadsBuyers: TableFilters;
    leadsSellers: TableFilters;
    leadsRenters: TableFilters;
    leadsLandlords: TableFilters;
    buyersAgentsBuyer: TableFilters;
    buyersAgentsRenter: TableFilters;
    listingsAgentsSales: TableFilters;
    listingsAgentsRentals: TableFilters;
    listingsAgentsProspects: TableFilters;
    matchesSales: TableFilters;
    matchesRentals: TableFilters;
    contacts: TableFilters;
    // Add more tables as needed
  };

  // Actions
  setFilters: (table: keyof SortingFiltersState["filters"], filters: Partial<TableFilters>) => void;
  getFilters: (table: keyof SortingFiltersState["filters"]) => TableFilters;
  resetFilters: (table?: keyof SortingFiltersState["filters"]) => void;
  setSorting: (table: keyof SortingFiltersState["filters"], sorting: SortingState) => void;
  setStatusFilter: (table: keyof SortingFiltersState["filters"], status: string) => void;
  setStatusFilters: (table: keyof SortingFiltersState["filters"], statuses: string[]) => void;
  setStageFilter: (table: keyof SortingFiltersState["filters"], stage: string) => void;
  setTypeFilter: (table: keyof SortingFiltersState["filters"], types: string[]) => void;
}

// Default filters for a table
const defaultTableFilters: TableFilters = {
  sorting: [],
  statusFilter: "",
  statusFilters: [],
  typeFilter: [],
  stageFilter: "",
};

// Create the store with persistence
export const useSortingFiltersStore = create<SortingFiltersState>()(
  persist(
    (set, get) => ({
      filters: {
        leadsBuyers: { ...defaultTableFilters },
        leadsSellers: { ...defaultTableFilters },
        leadsRenters: { ...defaultTableFilters },
        leadsLandlords: { ...defaultTableFilters },
        buyersAgentsBuyer: { ...defaultTableFilters },
        buyersAgentsRenter: { ...defaultTableFilters },
        listingsAgentsSales: { ...defaultTableFilters },
        listingsAgentsRentals: { ...defaultTableFilters },
        listingsAgentsProspects: { ...defaultTableFilters },
        matchesSales: { ...defaultTableFilters },
        matchesRentals: { ...defaultTableFilters },
        contacts: { ...defaultTableFilters },
      },

      // Set filters for a specific table
      setFilters: (table, newFilters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [table]: {
              ...state.filters[table],
              ...newFilters,
            },
          },
        })),

      // Get filters for a specific table
      getFilters: (table) => get().filters[table],

      // Reset filters for one or all tables
      resetFilters: (table) =>
        set((state) => ({
          filters: table
            ? {
                ...state.filters,
                [table]: { ...defaultTableFilters },
              }
            : Object.keys(state.filters).reduce(
                (acc, key) => ({
                  ...acc,
                  [key]: { ...defaultTableFilters },
                }),
                {} as SortingFiltersState["filters"]
              ),
        })),

      // Convenience methods for common operations
      setSorting: (table, sorting) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [table]: {
              ...state.filters[table],
              sorting,
            },
          },
        })),

      setStatusFilter: (table, statusFilter) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [table]: {
              ...state.filters[table],
              statusFilter,
            },
          },
        })),

      setStageFilter: (table, stageFilter) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [table]: {
              ...state.filters[table],
              stageFilter,
            },
          },
        })),

      setStatusFilters: (table, statusFilters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [table]: {
              ...state.filters[table],
              statusFilters,
            },
          },
        })),

      setTypeFilter: (table, typeFilter) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [table]: {
              ...state.filters[table],
              typeFilter,
            },
          },
        })),
    }),
    {
      name: "sorting-filters-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({ filters: state.filters }), // persist only the filters
    }
  )
);

// Export selector hooks for convenience
export const useTableFilters = (table: keyof SortingFiltersState["filters"]) =>
  useSortingFiltersStore((state) => state.filters[table]);

export const useTableSorting = (table: keyof SortingFiltersState["filters"]) =>
  useSortingFiltersStore((state) => state.filters[table].sorting);

export const useTableStatusFilter = (table: keyof SortingFiltersState["filters"]) =>
  useSortingFiltersStore((state) => state.filters[table].statusFilter);

export const useTableStageFilter = (table: keyof SortingFiltersState["filters"]) =>
  useSortingFiltersStore((state) => state.filters[table].stageFilter);

export const useTableTypeFilter = (table: keyof SortingFiltersState["filters"]) =>
  useSortingFiltersStore((state) => state.filters[table].typeFilter);

export const useTableStatusFilters = (table: keyof SortingFiltersState["filters"]) =>
  useSortingFiltersStore((state) => state.filters[table].statusFilters);
