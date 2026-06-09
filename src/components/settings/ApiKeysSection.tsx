import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2, Eye, EyeOff, Check, X } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function ApiKeysSection() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadApiKeys = async () => {
    if (!user || !currentWorkspace?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_api_keys')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('فشل في تحميل مفاتيح API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [user, currentWorkspace?.id]);

  const generateApiKey = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `wf_${timestamp}_${random}`;
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('يرجى إدخال اسم للمفتاح');
      return;
    }
    if (!currentWorkspace?.id) {
      toast.error('الرجاء تحديد workspace أولاً');
      return;
    }

    try {
      setCreating(true);
      const newApiKey = generateApiKey();
      
      const { data, error } = await supabase
        .from('tenant_api_keys')
        .insert({
          name: newKeyName.trim(),
          api_key: newApiKey,
          workspace_id: currentWorkspace.id
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys([data, ...apiKeys]);
      setNewKeyName('');
      toast.success('تم إنشاء مفتاح API بنجاح');
      
      // عرض المفتاح الجديد للمستخدم بنسخه تلقائياً
      setShowKey(data.id);
      copyToClipboard(newApiKey, data.id);
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('فشل في إنشاء مفتاح API');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف مفتاح API هذا؟ لن يتمكن البوت من إرسال الطلبات بعد الحذف.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenant_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success('تم حذف مفتاح API بنجاح');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('فشل في حذف مفتاح API');
    }
  };

  const toggleApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tenant_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, is_active: !currentStatus } : key
      ));
      
      const action = !currentStatus ? 'تفعيل' : 'تعطيل';
      toast.success(`تم ${action} مفتاح API بنجاح`);
    } catch (error) {
      console.error('Error toggling API key status:', error);
      toast.error('فشل في تغيير حالة مفتاح API');
    }
  };

  const copyToClipboard = async (key: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyId);
      toast.success('تم نسخ مفتاح API إلى الحافظة');
      
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('فشل في نسخ المفتاح');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'لم يستخدم بعد';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">مفاتيح API لبوت تليجرام</h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            استخدم هذه المفاتيح لربط بوت تليجرام الخاص بك لإرسال الطلبات تلقائياً
          </p>
        </div>
      </div>

      {/* Create New API Key */}
      <div className="bg-surface-container rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold">إنشاء مفتاح جديد</h4>
        </div>
        
        <div className="flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="اسم المفتاح (مثال: بوت المحل الرئيسي)"
            className="flex-1 bg-surface-container-highest rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={createApiKey}
            disabled={creating || !newKeyName.trim()}
            className="px-4 py-2.5 gradient-primary text-primary-container-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {creating ? 'جاري الإنشاء...' : 'إنشاء مفتاح'}
          </button>
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-on-surface-variant">المفاتيح النشطة</h4>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-sm text-on-surface-variant/60">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>لا توجد مفاتيح API بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="bg-surface-container rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm">{apiKey.name}</h5>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        apiKey.is_active 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {apiKey.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      تم الإنشاء: {formatDate(apiKey.created_at)}
                    </p>
                    {apiKey.last_used_at && (
                      <p className="text-xs text-on-surface-variant">
                        آخر استخدام: {formatDate(apiKey.last_used_at)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                      className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
                      title={showKey === apiKey.id ? 'إخفاء المفتاح' : 'عرض المفتاح'}
                    >
                      {showKey === apiKey.id ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleApiKeyStatus(apiKey.id, apiKey.is_active)}
                      className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
                      title={apiKey.is_active ? 'تعطيل المفتاح' : 'تفعيل المفتاح'}
                    >
                      {apiKey.is_active ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
                      title="حذف المفتاح"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                {showKey === apiKey.id && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span>مفتاح API الخاص بك:</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-surface-container-highest rounded-xl px-4 py-2.5 text-sm font-mono truncate">
                        {apiKey.api_key}
                      </div>
                      <button
                        onClick={() => copyToClipboard(apiKey.api_key, apiKey.id)}
                        className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        {copiedKey === apiKey.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* API Endpoint Info */}
                <div className="pt-3 border-t border-outline-variant/10">
                  <div className="text-xs text-on-surface-variant space-y-1">
                    <p className="font-bold">معلومات الـ Endpoint:</p>
                    <div className="bg-surface-container-highest rounded-lg p-3 font-mono text-[10px]">
                      <div>URL: https://your-project.supabase.co/functions/v1/telegram-bot-api</div>
                      <div>Method: POST</div>
                      <div>Header: X-API-Key: {apiKey.api_key}</div>
                      <div>Content-Type: application/json</div>
                    </div>
                    
                    <div className="mt-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                      <p className="font-bold text-blue-500">JSON مثال للبوت:</p>
                      <pre className="text-[10px] mt-1 whitespace-pre-wrap">
{`{
  "tenant_id": "your_workspace_id",
  "customer_phone": "+967771234567",
  "customer_name": "أحمد علي",
  "items": [
    {
      "product_name": "قميص أبيض",
      "quantity": 2,
      "size": "L",
      "color": "أبيض"
    }
  ],
  "address": "صنعاء - شارع حدة",
  "notes": "الدفع عند الاستلام",
  "bot_message_id": "msg_456"
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
        <h4 className="text-sm font-bold text-blue-500 mb-2">كيفية الاستخدام:</h4>
        <ol className="text-xs text-on-surface-variant space-y-2 list-decimal list-inside">
          <li>أنشئ مفتاح API جديد وأعطه اسماً مميزاً</li>
          <li>انسخ مفتاح API وعرضه مرة واحدة فقط - لا تشاركه مع أي شخص</li>
          <li>أضف الـ Header <code className="bg-surface-container-high px-1 rounded">X-API-Key</code> في بوت تليجرام الخاص بك</li>
          <li>أرسل طلبات POST إلى <code className="bg-surface-container-high px-1 rounded">/api/orders/incoming</code></li>
          <li>ستظهر الطلبات الجديدة في لوحة الطلبات تحت "جديد"</li>
        </ol>
      </div>
    </div>
  );
}