import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Order = Tables<"orders">;
export type OrderInsert = TablesInsert<"orders">;
export type OrderItem = Tables<"order_items">;

export function useOrders() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["orders", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user && !!currentWorkspace?.id,
  });

  const addOrder = useMutation({
    mutationFn: async (order: Omit<OrderInsert, "workspace_id" | "user_id">) => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");

      const { data, error } = await supabase
        .from("orders")
        .insert({ 
          ...order, 
          workspace_id: currentWorkspace.id,
          user_id: user!.id,
          source: 'telegram' 
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", currentWorkspace?.id] }),
  });

  const addOrderWithItems = useMutation({
    mutationFn: async ({
      order,
      items
    }: {
      order: Omit<OrderInsert, "workspace_id" | "user_id">;
      items: Array<{
        product_name: string;
        quantity: number;
        price?: number;
        size?: string;
        color?: string;
        sku?: string;
      }>;
    }) => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");

      // إنشاء الطلب أولاً
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          ...order,
          workspace_id: currentWorkspace.id,
          user_id: user!.id,
          source: 'telegram'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // إنشاء العناصر
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price || 0,
        size: item.size || null,
        color: item.color || null,
        sku: item.sku || null
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        // حذف الطلب إذا فشل إنشاء العناصر
        await supabase.from("orders").delete().eq("id", orderData.id);
        throw itemsError;
      }

      return { order: orderData, items: orderItems };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", currentWorkspace?.id] }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order["status"] }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", currentWorkspace?.id] }),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", currentWorkspace?.id] }),
  });

  const getOrdersByStatus = (status: Order["status"]) => {
    return (ordersQuery.data || []).filter(order => order.status === status);
  };

  const getNewOrders = () => getOrdersByStatus("pending");
  const getProcessingOrders = () => getOrdersByStatus("processing");
  const getDeliveringOrders = () => getOrdersByStatus("delivering");
  const getCompletedOrders = () => getOrdersByStatus("completed");

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    addOrder,
    addOrderWithItems,
    updateOrderStatus,
    deleteOrder,
    getNewOrders,
    getProcessingOrders,
    getDeliveringOrders,
    getCompletedOrders,
    refetch: ordersQuery.refetch
  };
}
