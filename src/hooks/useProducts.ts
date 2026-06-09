import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export function useProducts() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    enabled: !!user && !!currentWorkspace?.id,
  });

  const addProduct = useMutation({
    mutationFn: async (product: Omit<ProductInsert, "workspace_id">) => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, workspace_id: currentWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", currentWorkspace?.id] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", currentWorkspace?.id] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", currentWorkspace?.id] }),
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", currentWorkspace?.id] }),
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
  };
}
