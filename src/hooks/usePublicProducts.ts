import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export function usePublicProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-products", slug],
    queryFn: async () => {
      if (!slug) return [];
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("slug", slug)
        .maybeSingle();
      if (!ws) return [];
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("workspace_id", ws.id)
        .eq("is_available", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      return { workspaceName: ws.name, products: (products ?? []) as Product[] };
    },
    enabled: !!slug,
  });
}
