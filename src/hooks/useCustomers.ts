import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Customer = Tables<"customers">;
export type CustomerInsert = TablesInsert<"customers">;
export type CustomerUpdate = TablesUpdate<"customers">;

export interface CustomerWithStats {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  total_orders: number;
  total_revenue: number;
}

export function useCustomers() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
    enabled: !!user && !!currentWorkspace?.id,
  });

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<CustomerInsert, "user_id" | "workspace_id">) => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");

      const { data, error } = await supabase
        .from("customers")
        .insert({ ...customer, user_id: user!.id, workspace_id: currentWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", currentWorkspace?.id] }),
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", currentWorkspace?.id] }),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", currentWorkspace?.id] }),
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
