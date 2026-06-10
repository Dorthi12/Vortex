import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;          // Controls mobile overlay menu open/close
  sidebarCollapsed: boolean;     // Controls desktop sidebar width collapse/expand
  notificationPanelOpen: boolean; // Controls right notification drawer open/close
  activeTab: string;             // Tracks current page context for mock shell
  userLocation: string;          // Tracks user location context for 50km radius scans
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setUserLocation: (location: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  activeTab: 'Dashboard',
  userLocation: 'Shivajinagar',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleNotificationPanel: () => set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setUserLocation: (location) => set({ userLocation: location }),
}));
