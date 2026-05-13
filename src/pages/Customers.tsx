import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useCustomers, type CustomerWithStats } from "@/hooks/useCustomers";
import { useSettings } from "@/hooks/useSettings";
import {
  Users, Plus, Phone, Mail, Search, SlidersHorizontal, ArrowUpDown,
  Download, Share2, MoreVertical, ChevronLeft, ChevronRight, TrendingUp,
  Send, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

type Tab = "all" | "top" | "new" | "dormant";

export default function CustomersPage() {
  const { customers, isLoading, addCustomer, deleteCustomer } = useCustomers();
  const { settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [promoMessage, setPromoMessage] = useState("مرحباً {name}! 👋\nلدينا عروض حصرية خصيصاً لك. تفضل بزيارة متجرنا للاطلاع على أحدث العروض 🎁");
  const [sendingPromo, setSendingPromo] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.total_orders > 0).length;
  const avgValue = totalCustomers > 0
    ? Math.round(customers.reduce((s, c) => s + Number(c.total_revenue), 0) / totalCustomers)
    : 0;

  // Filtering
  const filtered = useMemo(() => {
    let list = [...customers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }
    if (tab === "top") {
      list = list.filter((c) => Number(c.total_revenue) >= 5000);
    } else if (tab === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      list = list.filter((c) => new Date(c.created_at) >= thirtyDaysAgo);
    } else if (tab === "dormant") {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      list = list.filter((c) => new Date(c.updated_at) < sixtyDaysAgo && c.total_orders > 0);
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [customers, search, tab]);

  const handleSendPromo = async () => {
    if (!settings.whapi_token) {
      toast.error("أضف Whapi Token في الإعدادات أولاً");
      return;
    }
    if (filtered.length === 0) {
      toast.error("لا يوجد عملاء في هذه القائمة");
      return;
    }
    setSendingPromo(true);
    let sent = 0;
    let failed = 0;
    for (const customer of filtered) {
      const message = promoMessage.replace("{name}", customer.name);
      try {
        const phone = customer.phone.replace(/\D/g, "");
        const res = await fetch("https://gate.whapi.cloud/messages/text", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.whapi_token}` },
          body: JSON.stringify({ to: `${phone}@s.whatsapp.net`, body: message }),
        });
        if (res.ok) sent++; else failed++;
      } catch { failed++; }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
    setSendingPromo(false);
    toast.success(`تم الإرسال: ${sent} ✅ | فشل: ${failed} ❌`);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer.mutate(
      { name, phone, email: email || null, notes: notes || null },
      {
        onSuccess: () => {
          toast.success("تمت إضافة العميل");
          setName(""); setPhone(""); setEmail(""); setNotes("");
          setShowForm(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDelete = (id: string, customerName: string) => {
    if (!confirm(`هل تريد حذف العميل "${customerName}"؟`)) return;
    deleteCustomer.mutate(id, {
      onSuccess: () => toast.success("تم حذف العميل"),
      onError: (err) => toast.error(err.message),
    });
  };

  const getCustomerId = (c: CustomerWithStats) =>
    `#C-${c.id.substring(0, 4).toUpperCase()}`;

  const getStatusBadge = (c: CustomerWithStats) => {
    if (Number(c.total_revenue) >= 5000) return { label: "نشط", active: true };
    if (c.total_orders === 0) return { label: "غير نشط", active: false };
    return { label: "نشط", active: true };
  };

  // Top customers this month
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => Number(b.total_orders) - Number(a.total_orders))
      .slice(0, 3);
  }, [customers]);

  return (
    <AppLayout onNewOrder={() => setShowForm(true)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold font-headline">قاعدة بيانات العملاء</h2>
            <p className="text-on-surface-variant text-sm mt-1">
              إدارة وتتبع جميع علاقات العملاء في مكان واحد باستخدام تحليلات القيمة الدائمة والبيانات المتقدمة.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="gradient-primary text-primary-container-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            عميل جديد
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="إجمالي العملاء" value={totalCustomers.toLocaleString("ar-SA")} />
          <StatCard label="العملاء النشطين" value={activeCustomers.toLocaleString("ar-SA")} color="primary" />
          <StatCard label="متوسط القيمة" value={`${avgValue.toLocaleString("ar-SA")} ر.س`} />
        </div>

        {/* Add customer form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">الاسم</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                  placeholder="اسم العميل" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">الهاتف</label>
                <input required value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                  placeholder="+966..." dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">البريد الإلكتروني</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                  placeholder="email@example.com" dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">ملاحظات</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                  placeholder="ملاحظات اختيارية" />
              </div>
            </div>
            <button type="submit" disabled={addCustomer.isPending}
              className="gradient-primary text-primary-container-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
              {addCustomer.isPending ? "جاري الإضافة..." : "إضافة العميل"}
            </button>
          </form>
        )}

        {/* Filters & Search */}
        <div className="bg-surface-container-low rounded-2xl p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Right: tabs, sort, filter */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Tabs */}
              <div className="flex bg-surface-container rounded-xl overflow-hidden">
                {(
                  [
                    { key: "all", label: "الكل" },
                    { key: "top", label: "كبار العملاء" },
                    { key: "new", label: "جديد" },
                    { key: "dormant", label: "غائبون" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setPage(1); }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      tab === t.key
                        ? "gradient-primary text-primary-container-foreground"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant text-sm hover:bg-surface-container-high transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5" />
                ترتيب حسب
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant text-sm hover:bg-surface-container-high transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                تصفية
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="البحث في العملاء، الطلبات أو التقارير..."
              className="w-full bg-surface-container-highest rounded-xl pr-10 pl-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        {/* Promo banner for dormant customers */}
        {tab === "dormant" && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">إرسال عرض ترويجي للعملاء الغائبين</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {filtered.length} عميل لم يطلب منذ أكثر من شهرين
                </p>
              </div>
              <button
                onClick={handleSendPromo}
                disabled={sendingPromo || filtered.length === 0}
                className="flex items-center gap-2 gradient-primary text-primary-container-foreground px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sendingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingPromo ? "جاري الإرسال..." : "إرسال عرض"}
              </button>
            </div>
            <textarea
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder="نص الرسالة الترويجية... استخدم {name} لاسم العميل"
            />
            <p className="text-[10px] text-on-surface-variant">استخدم {"{name}"} ليتم استبداله باسم كل عميل تلقائياً</p>
          </div>
        )}

        {/* Promo banner for dormant customers */}
        {tab === "dormant" && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold">إرسال عرض ترويجي للعملاء الغائبين</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {filtered.length} عميل لم يطلب منذ أكثر من شهرين
                </p>
              </div>
              <button
                onClick={handleSendPromo}
                disabled={sendingPromo || filtered.length === 0}
                className="flex items-center gap-2 gradient-primary text-primary-container-foreground px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sendingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingPromo ? "جاري الإرسال..." : "إرسال عرض"}
              </button>
            </div>
            <textarea
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder="نص الرسالة الترويجية..."
            />
            <p className="text-[10px] text-on-surface-variant">
              استخدم <span className="font-mono text-primary">{"{name}"}</span> ليتم استبداله باسم كل عميل تلقائياً
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-low rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
            <Users className="w-12 h-12 text-on-surface-variant/30" />
            <p className="text-on-surface-variant text-sm">لا يوجد عملاء بعد — أضف أول عميل</p>
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs font-bold text-on-surface-variant">
              <span>العميل</span>
              <span>معلومات الاتصال</span>
              <span className="text-center">إجمالي الطلبات</span>
              <span className="text-center">قيمة الأرباح</span>
              <span className="text-center">الحالة</span>
              <span></span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-outline-variant/10">
              {paginated.map((c) => {
                const status = getStatusBadge(c);
                return (
                  <div
                    key={c.id}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-surface-container-highest/30 transition-colors"
                  >
                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{c.name}</p>
                        <p className="text-[11px] text-on-surface-variant">ID: {getCustomerId(c)}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Mail className="w-3 h-3" /> {c.email}
                        </span>
                      )}
                    </div>

                    {/* Total orders */}
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container text-sm font-bold text-on-surface">
                        {c.total_orders}
                      </span>
                    </div>

                    {/* Revenue */}
                    <div className="text-center">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {Number(c.total_revenue).toLocaleString("ar-SA")} ر.س
                      </span>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          status.active
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.active ? "bg-primary" : "bg-on-surface-variant/50"}`} />
                        {status.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="relative group">
                      <button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute left-0 top-full mt-1 bg-surface-container-high rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="w-full text-right px-4 py-2 text-xs text-destructive hover:bg-surface-container-highest transition-colors"
                        >
                          حذف العميل
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-xs text-on-surface-variant">
                عرض {ITEMS_PER_PAGE} من أصل {filtered.length.toLocaleString("ar-SA")} عميل
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 transition-colors text-on-surface-variant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === p
                        ? "gradient-primary text-primary-container-foreground"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 3 && (
                  <>
                    <span className="text-on-surface-variant text-xs px-1">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        page === totalPages
                          ? "gradient-primary text-primary-container-foreground"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 transition-colors text-on-surface-variant"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom section: Top customers & Chart placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top customers */}
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold font-headline">العملاء المميزون هذا الشهر</h3>
            {topCustomers.length === 0 ? (
              <p className="text-xs text-on-surface-variant">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{c.name}</p>
                        <p className="text-[11px] text-primary">{c.total_orders} طلبات جديدة</p>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart — revenue distribution */}
          <div className="md:col-span-2 bg-surface-container-low rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-headline">توزيع قيمة العملاء</h3>
            </div>
            {customers.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-on-surface-variant/30 text-sm">
                لا توجد بيانات بعد
              </div>
            ) : (
              <div className="space-y-2">
                {[...customers]
                  .sort((a, b) => Number(b.total_revenue) - Number(a.total_revenue))
                  .slice(0, 5)
                  .map((c) => {
                    const max = Math.max(...customers.map((x) => Number(x.total_revenue)), 1);
                    const pct = Math.round((Number(c.total_revenue) / max) * 100);
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-on-surface-variant truncate max-w-[120px]">{c.name}</span>
                          <span className="font-bold tabular-nums">{Number(c.total_revenue).toLocaleString("ar-SA")} ر.س</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col items-center justify-center gap-1">
      <span className="text-[11px] text-on-surface-variant font-medium">{label}</span>
      <span className={`text-2xl font-extrabold font-headline tabular-nums ${color === "primary" ? "text-primary" : "text-on-surface"}`}>
        {value}
      </span>
    </div>
  );
}
