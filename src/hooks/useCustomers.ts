import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
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
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_customers_with_stats", { p_user_id: user!.id });
      if (error) throw error;
      return (data ?? []) as CustomerWithStats[];
    },
    enabled: !!user,
  });

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<CustomerInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...customer, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
