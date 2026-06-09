import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface TelegramOrderRequest {
  tenant_id: string;  // workspace_id في نظامنا
  customer_phone: string;
  customer_name: string;
  items: Array<{
    product_name: string;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  address?: string;
  notes?: string;
  bot_message_id?: string;
}

interface OrderResponse {
  success: boolean;
  order_id?: string;
  error?: string;
}

// حساب المبلغ الإجمالي من العناصر (يمكن توسيعه لاستخدام أسعار المنتجات من قاعدة البيانات)
function calculateTotalAmount(items: TelegramOrderRequest['items']): number {
  // هنا يمكنك ربطها بقاعدة بيانات المنتجات للحصول على السعر الحقيقي
  // حالياً نستخدم سعر افتراضي 10 لكل منتج
  return items.reduce((total, item) => total + (item.quantity * 10), 0);
}

serve(async (req) => {
  // معالجة طلبات CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // التحقق من API Key في الـ Header
    const apiKey = req.headers.get('X-API-Key')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API Key مطلوب في الـ Header باسم X-API-Key' 
        } as OrderResponse),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إنشاء Supabase client مع service role key للتحقق من API Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          persistSession: false 
        } 
      }
    )

    // التحقق من صحة API Key والحصول على workspace_id
    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .rpc('verify_api_key', { api_key_text: apiKey })

    if (apiKeyError || !apiKeyData || apiKeyData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API Key غير صالح أو منتهي الصلاحية' 
        } as OrderResponse),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { workspace_id, api_key_id } = apiKeyData[0]

    // قراءة body الطلب
    const requestData: TelegramOrderRequest = await req.json()
    
    // التحقق من البيانات المطلوبة
    if (!requestData.tenant_id || !requestData.customer_phone || !requestData.customer_name || !requestData.items || !Array.isArray(requestData.items)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'بيانات غير كاملة: tenant_id, customer_phone, customer_name, items مطلوبة' 
        } as OrderResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // التحقق أن tenant_id يطابق workspace_id من API Key (أمان إضافي)
    if (requestData.tenant_id !== workspace_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'tenant_id لا يطابق الـ workspace المرتبط بالـ API Key' 
        } as OrderResponse),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // حساب المبلغ الإجمالي
    const totalAmount = calculateTotalAmount(requestData.items)

    // بدء معاملة لإنشاء الطلب والعناصر
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        workspace_id: workspace_id,
        customer_name: requestData.customer_name,
        phone: requestData.customer_phone,
        address: requestData.address || null,
        details: requestData.notes || null,
        amount: totalAmount,
        status: 'pending', // "جديد" في النظام
        source: 'phone', // مصدر تليجرام
        bot_message_id: requestData.bot_message_id || null,
        bot_source: 'telegram'
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'فشل في إنشاء الطلب: ' + orderError.message 
        } as OrderResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إنشاء العناصر (items) للطلب
    const orderItems = requestData.items.map(item => ({
      order_id: orderData.id,
      product_name: item.product_name,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
      price: 10, // سعر افتراضي - يمكن جعله ديناميكي من قاعدة البيانات
      sku: null // يمكن توليد SKU أو ربطه بجدول المنتجات
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // حذف الطلب إذا فشل إنشاء العناصر
      await supabaseAdmin.from('orders').delete().eq('id', orderData.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'فشل في إنشاء عناصر الطلب: ' + itemsError.message 
        } as OrderResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // البحث عن العميل أو إنشائه
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('phone', requestData.customer_phone)
      .single()

    let customerId = null

    if (!existingCustomer) {
      // إنشاء عميل جديد
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          workspace_id: workspace_id,
          name: requestData.customer_name,
          phone: requestData.customer_phone,
          notes: `تم الإنشاء تلقائياً من بوت تليجرام - ${new Date().toLocaleDateString('ar-SA')}`
        })
        .select('id')
        .single()

      if (!customerError && newCustomer) {
        customerId = newCustomer.id
        
        // تحديث الطلب بربطه بالعميل
        await supabaseAdmin
          .from('orders')
          .update({ customer_id: customerId })
          .eq('id', orderData.id)
      }
    } else {
      customerId = existingCustomer.id
      
      // تحديث الطلب بربطه بالعميل الموجود
      await supabaseAdmin
        .from('orders')
        .update({ customer_id: customerId })
        .eq('id', orderData.id)
    }

    // تسجيل استخدام الـ API Key
    await supabaseAdmin
      .from('tenant_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', api_key_id)

    // إرجاع الرد الناجح
    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: orderData.id,
        order_number: orderData.order_number,
        workspace_id: workspace_id,
        customer_id: customerId,
        total_amount: totalAmount
      } as any),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'خطأ داخلي في الخادم: ' + error.message 
      } as OrderResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})