import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  price: number;
  image_url: string | null;
  created_at: string;
}

export interface OrderWithItems {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  details: string | null;
  amount: number;
  status: "pending" | "processing" | "delivering" | "completed" | "cancelled";
  source: "whatsapp" | "store" | "phone";
  address: string | null;
  payment_method: string | null;
  payment_note: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  items: OrderItem[];
}

export function useOrderDetails(orderId: string | undefined) {
  const { user } = useAuth();

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId!)
        .single();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId!);
      if (itemsError) throw itemsError;

      return { ...order, items: items ?? [] } as OrderWithItems;
    },
    enabled: !!user && !!orderId,
  });

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    error: orderQuery.error,
  };
}
