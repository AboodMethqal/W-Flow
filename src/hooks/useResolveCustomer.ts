import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";

/**
 * Returns a function that resolves a customer_id by phone number.
 * - If a customer with that phone exists → returns their id.
 * - Otherwise → creates a new customer and returns the new id.
 */
export function useResolveCustomer() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const resolveCustomer = async (phone: string, name: string): Promise<string> => {
    if (!currentWorkspace?.id) throw new Error("No workspace selected");

    // 1. Look up existing customer by phone for this workspace
    const { data: existing, error: lookupError } = await supabase
      .from("customers")
      .select("id")
      .eq("workspace_id", currentWorkspace.id)
      .eq("phone", phone)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existing) return existing.id;

    // 2. Not found — create a new customer
    const { data: created, error: createError } = await supabase
      .from("customers")
      .insert({ user_id: user!.id, workspace_id: currentWorkspace.id, name, phone })
      .select("id")
      .single();

    if (createError) throw createError;
    return created.id;
  };

  return { resolveCustomer };
}
