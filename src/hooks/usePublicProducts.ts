import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export interface StoreInfo {
  workspaceName: string;
  workspaceId: string;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  socialLinks: Record<string, string>;
}

export function usePublicProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-products", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, logo_url, description, phone, address, social_links")
        .eq("slug", slug)
        .maybeSingle();
      if (!ws) return null;
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("workspace_id", ws.id)
        .eq("is_available", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      return {
        store: {
          workspaceName: ws.name,
          workspaceId: ws.id,
          logoUrl: ws.logo_url,
          description: ws.description,
          phone: ws.phone,
          address: ws.address,
          socialLinks: (ws.social_links as Record<string, string>) || {},
        } as StoreInfo,
        products: (products ?? []) as Product[],
      };
    },
    enabled: !!slug,
  });
}
