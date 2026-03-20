import { create } from 'zustand';

interface UIStore {
    sidebarOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    sidebarOpen: false,
    openSidebar: () => set({ sidebarOpen: true }),
    closeSidebar: () => set({ sidebarOpen: false }),
}));
