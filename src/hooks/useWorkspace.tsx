import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url?: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  isLoading: boolean;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, slug: string) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAutoCreated, setHasAutoCreated] = useState(false);

  // تحميل workspaces للمستخدم
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setWorkspaceMembers([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
      return;
    }

    loadWorkspaces();
  }, [user]);

  const loadWorkspaces = async (isRetry = false) => {
    try {
      setIsLoading(true);

      // جلب جميع الـ workspaces التي ينتمي إليها المستخدم
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('user_id', user!.id);

      if (membersError) throw membersError;

      setWorkspaceMembers(members || []);

      if (members && members.length > 0) {
        // جلب تفاصيل الـ workspaces
        const workspaceIds = members.map(m => m.workspace_id);
        const { data: workspacesData, error: workspacesError } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', workspaceIds);

        if (workspacesError) throw workspacesError;

        const workspacesList = workspacesData || [];
        setWorkspaces(workspacesList);

        // اختيار workspace افتراضي (الأول أو آخر workspace تم اختياره)
        const savedWorkspaceId = localStorage.getItem('selected_workspace_id');
        const defaultWorkspace = savedWorkspaceId 
          ? workspacesList.find(w => w.id === savedWorkspaceId)
          : workspacesList[0];

        if (defaultWorkspace) {
          setCurrentWorkspace(defaultWorkspace);
        }
      } else if (!isRetry && !hasAutoCreated) {
        // لا يوجد workspace → إنشاء واحد تلقائياً
        setHasAutoCreated(true);
        const displayName = user?.email?.split('@')[0] || 'My';
        const slug = 'ws-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        await createWorkspace(`${displayName}'s Workspace`, slug);
        // إعادة التحميل بعد الإنشاء
        await loadWorkspaces(true);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('selected_workspace_id', workspaceId);
    }
  };

  const createWorkspace = async (name: string, slug: string): Promise<Workspace> => {
    if (!user) throw new Error('User not authenticated');

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        name,
        slug,
        owner_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // إضافة المستخدم كـ owner للـ workspace الجديد
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner'
      });

    if (memberError) throw memberError;

    // تحديث القائمة
    await loadWorkspaces();
    selectWorkspace(workspace.id);

    return workspace;
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>): Promise<void> => {
    const { error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId);

    if (error) throw error;

    // تحديث القائمة
    await loadWorkspaces();
    // تحديث current workspace إذا كان هو المحدث
    if (currentWorkspace?.id === workspaceId) {
      setCurrentWorkspace(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const value = {
    currentWorkspace,
    workspaces,
    workspaceMembers,
    isLoading,
    selectWorkspace,
    createWorkspace,
    updateWorkspace
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}