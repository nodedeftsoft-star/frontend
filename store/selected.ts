import { create } from "zustand";
import { Buyer, Renter } from "@/types/buyers-agent";
import { LeadsBuyer, LeadsSeller, LeadsLandLord, LeadsRenter } from "@/types/leads";
import { propertyData } from "@/types/sellers-agent";
import { matchData } from "@/types/matches";
import { Prospect, ListingRentals, ListingSales } from "@/types/listings";

// Define the store state
interface SelectedBuyersAgentState {
  selectedAgent: Buyer | Renter | null;
  setSelectedAgent: (buyer: Buyer | Renter | null) => void;
  clearAgent: () => void;
}

interface SelectedLeadsState {
  selectedLead: LeadsBuyer | LeadsRenter | LeadsLandLord | LeadsSeller | Prospect | null;
  setSelectedLead: (buyer: LeadsBuyer | LeadsRenter | LeadsLandLord | LeadsSeller | Prospect | null) => void;
  clearLead: () => void;
}
interface SelectedSellersAgentState {
  selectedAgent: propertyData | null;
  setSelectedAgent: (seller: propertyData | null) => void;
  clearAgent: () => void;
}

interface SelectedMatchState {
  selectedMatch: matchData | null;
  setSelectedMatch: (match: matchData | null) => void;
  clearAgent: () => void;
}

interface SelectedProspectState {
  selectedProspect: Prospect | null;
  isViewingProspect: boolean;
  setSelectedProspect: (prospect: Prospect | null) => void;
  setIsViewingProspect: (isViewing: boolean) => void;
  clearProspect: () => void;
}

interface SelectedListingState {
  selectedListing: ListingSales | ListingRentals | null;
  setSelectedListing: (listing: ListingSales | ListingRentals | null) => void;
  clearListing: () => void;
}
// Create the store
export const useSelectedBuyersAgentStore = create<SelectedBuyersAgentState>((set) => ({
  selectedAgent: null,
  setSelectedAgent: (buyer) => set({ selectedAgent: buyer }),
  clearAgent: () => set({ selectedAgent: null }),
}));

export const useSelectedSellersAgentStore = create<SelectedSellersAgentState>((set) => ({
  selectedAgent: null,
  setSelectedAgent: (seller) => set({ selectedAgent: seller }),
  clearAgent: () => set({ selectedAgent: null }),
}));

export const useSelectedMatchStore = create<SelectedMatchState>((set) => ({
  selectedMatch: null,
  setSelectedMatch: (match) => set({ selectedMatch: match }),
  clearAgent: () => set({ selectedMatch: null }),
}));

export const useSelectedProspectStore = create<SelectedProspectState>((set) => ({
  selectedProspect: null,
  isViewingProspect: false,
  setSelectedProspect: (prospect) => set({ selectedProspect: prospect }),
  setIsViewingProspect: (isViewing) => set({ isViewingProspect: isViewing }),
  clearProspect: () => set({ selectedProspect: null, isViewingProspect: false }),
}));

export const useSelectedListingStore = create<SelectedListingState>((set) => ({
  selectedListing: null,
  setSelectedListing: (listing) => set({ selectedListing: listing }),
  clearListing: () => set({ selectedListing: null }),
}));

export const useSelectedLeadsStore = create<SelectedLeadsState>((set) => ({
  selectedLead: null,
  setSelectedLead: (lead) => set({ selectedLead: lead }),
  clearLead: () => set({ selectedLead: null }),
}));
