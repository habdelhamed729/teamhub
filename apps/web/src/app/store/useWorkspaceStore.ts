import { create } from 'zustand';
import type { Workspace } from '@teamhub/shared';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  
  selectWorkspace: (id: string) => void;
  
  clearWorkspaces: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,

      setWorkspaces: (workspaces) => set({ workspaces }),
      
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

      selectWorkspace: (id) => {
        const workspace = get().workspaces.find((w) => w.id === id);
        if (workspace) {
          set({ activeWorkspace: workspace });
        }
      },

      clearWorkspaces: () => set({ workspaces: [], activeWorkspace: null }),
    }),
  
);
