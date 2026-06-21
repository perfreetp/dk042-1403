import { create } from 'zustand';
import type { Resource, ResourceType } from '@/types';
import { mockResources } from '@/data/mockData';

interface ResourceState {
  resources: Resource[];
  selectedResources: Resource[];
  activeTab: ResourceType | 'all';
  setActiveTab: (tab: ResourceType | 'all') => void;
  selectResource: (resource: Resource) => void;
  deselectResource: (resourceId: string) => void;
  isSelected: (resourceId: string) => boolean;
  clearSelection: () => void;
  getResourcesByType: (type: ResourceType) => Resource[];
  getAvailableResources: () => Resource[];
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: mockResources,
  selectedResources: [],
  activeTab: 'all',

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  selectResource: (resource) => {
    if (resource.status !== 'available') return;
    const { selectedResources } = get();
    const exists = selectedResources.some((r) => r.id === resource.id);
    if (!exists) {
      set({ selectedResources: [...selectedResources, resource] });
    }
  },

  deselectResource: (resourceId) => {
    set((state) => ({
      selectedResources: state.selectedResources.filter((r) => r.id !== resourceId),
    }));
  },

  isSelected: (resourceId) => {
    return get().selectedResources.some((r) => r.id === resourceId);
  },

  clearSelection: () => {
    set({ selectedResources: [] });
  },

  getResourcesByType: (type) => {
    return get()
      .resources.filter((r) => r.type === type)
      .sort((a, b) => a.distance - b.distance);
  },

  getAvailableResources: () => {
    return get().resources.filter((r) => r.status === 'available');
  },
}));
