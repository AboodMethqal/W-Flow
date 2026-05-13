import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserSettings {
  id?: string;
  business_name: string | null;
  store_url: string | null;
  whapi_token: string | null;
  whapi_channel_id: string | null;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  daily_report_enabled: boolean;
  daily_report_phone: string | null;
  msg_delivering: string | null;
  msg_completed: string | null;
}

export const defaults: UserSettings = {
  business_name: null,
  store_url: null,
  whapi_token: null,
  whapi_channel_id: null,
  auto_reply_enabled: true,
  auto_reply_message: "مرحباً! 👋 للاطلاع على أسعارنا وتفاصيل المنتجات، تفضل بزيارة متجرنا: {store_url}",
  daily_report_enabled: true,
  daily_report_phone: null,
  msg_delivering: "أهلاً {customer_name} 🚚\nطلبك رقم #{order_number} تم شحنه بنجاح وهو في طريقه إليك.\nشكراً لثقتك بنا! 💚",
  msg_completed: "أهلاً {customer_name} ✅\nطلبك رقم #{order_number} تم تسليمه بنجاح.\nنشكرك على تعاملك معنا، يسعدنا تقييمك لتجربتك! ⭐",
};

export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = defaults, isLoading } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!data) return defaults;
      // Merge with defaults so new fields always have a value
      return { ...defaults, ...data } as UserSettings;
    },
    enabled: !!user,
  });

  const saveSettings = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      const { error } = await supabase
        .from("settings")
        .upsert({ ...updates, user_id: user!.id }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  return { settings, isLoading, saveSettings };
}
