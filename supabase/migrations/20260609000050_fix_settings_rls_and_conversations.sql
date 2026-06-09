-- Fix settings RLS: drop user_id-based policy, replace with workspace-based
DROP POLICY IF EXISTS "Users can manage own settings" ON public.settings;

CREATE POLICY "Workspace members can manage settings"
  ON public.settings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Add full RLS policies for conversations table
CREATE POLICY "Workspace members can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update conversations"
  ON public.conversations FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete conversations"
  ON public.conversations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );
