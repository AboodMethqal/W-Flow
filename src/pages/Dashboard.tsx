import { useState, useMemo } from "react";
import { Download, Search, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import ReadinessChecklist from "@/components/dashboard/ReadinessChecklist";
import QuickActions from "@/components/dashboard/QuickActions";
import NewOrderModal from "@/components/modals/NewOrderModal";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useWorkspace } from "@/hooks/useWorkspace";
import { startOfDay } from "date-fns";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { products, isLoading: productsLoading } = useProducts();
  const { customers, isLoading: customersLoading } = useCustomers();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [searchNum, setSearchNum] = useState("");

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);
    const todaySales = todayOrders
      .filter((o) => o.status === "completed" || o.status === "delivering")
      .reduce((sum, o) => sum + Number(o.amount), 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;

    return {
      todayOrdersCount: todayOrders.length,
      todaySales,
      pendingOrders,
      completedOrders,
    };
  }, [orders, todayStart]);

  const quickStatsData = useMemo(() => ({
    totalProducts: products.length,
    totalCustomers: customers.length,
    totalOrders: orders.length,
    pendingOrders: stats.pendingOrders,
    completedOrders: stats.completedOrders,
  }), [products.length, customers.length, orders.length, stats.pendingOrders, stats.completedOrders]);

  const checklistData = useMemo(() => ({
    storeInfo: !!(currentWorkspace?.name && (currentWorkspace as any).description),
    productsAdded: products.length > 0,
    productImages: products.some((p) => !!p.image_url),
    telegramActive: orders.length >= 0,
    ordersReceived: orders.length > 0,
    displayName: currentWorkspace?.name ?? "",
  }), [currentWorkspace, products, orders.length]);

  const last5Orders = useMemo(() => orders.slice(0, 5), [orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNum.trim()) return;
    const num = parseInt(searchNum.trim());
    if (isNaN(num)) {
      toast.error("يرجى إدخال رقم صحيح");
      return;
    }
    const found = orders.find((o) => o.order_number === num);
    if (found) {
      navigate(`/orders/${found.id}`);
    } else {
      toast.error("لم يتم العثور على طلب بهذا الرقم");
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("لا توجد طلبات لتصديرها");
      return;
    }
    const headers = ["رقم الطلب", "اسم العميل", "الهاتف", "المبلغ", "الحالة", "التاريخ"];
    const rows = orders.map((o) => [
      o.order_number,
      o.customer_name,
      o.phone,
      o.amount,
      o.status,
      new Date(o.created_at).toLocaleDateString("ar-SA"),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير الطلبات بنجاح");
  };

  const statusLabels: Record<string, string> = {
    pending: "جديد",
    processing: "قيد التحضير",
    delivering: "جاهز",
    completed: "مسلّم",
    cancelled: "ملغي",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-blue-500/10 text-blue-500",
    processing: "bg-yellow-500/10 text-yellow-500",
    delivering: "bg-purple-500/10 text-purple-500",
    completed: "bg-green-500/10 text-green-500",
    cancelled: "bg-red-500/10 text-red-500",
  };

  const isLoading = ordersLoading || productsLoading || customersLoading;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10 px-2" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
              الرئيسية
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">مرحباً بك! إليك ملخص سريع لأعمالك اليوم.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="flex-1 md:flex-initial px-5 py-3.5 gradient-primary text-primary-container-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-sm shadow-md"
            >
              <span>إضافة طلب سريع</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-3.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold transition-all text-on-surface active:scale-95 flex items-center gap-2"
              title="تصدير CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* Readiness Checklist */}
        <ReadinessChecklist data={checklistData} />

        {/* Quick Stats */}
        <QuickStats data={quickStatsData} isLoading={isLoading} />

        {/* Today's Stats Section */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 shadow-sm">
              <span className="text-on-surface-variant text-xs font-bold block mb-2">طلبات اليوم</span>
              <p className="text-3xl font-black text-on-surface tabular-nums">{stats.todayOrdersCount}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 shadow-sm">
              <span className="text-on-surface-variant text-xs font-bold block mb-2">مبيعات اليوم</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-on-surface tabular-nums">
                  {stats.todaySales.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-primary font-bold">ر.س</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 shadow-sm">
              <span className="text-on-surface-variant text-xs font-bold block mb-2">الطلبات المعلقة</span>
              <p className="text-3xl font-black text-primary tabular-nums">{stats.pendingOrders}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 shadow-sm">
          <label className="text-xs font-bold text-on-surface-variant block mb-2">بحث سريع برقم الطلب</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-outline absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="أدخل رقم الطلب (مثال: 1024)..."
                value={searchNum}
                onChange={(e) => setSearchNum(e.target.value)}
                className="w-full bg-surface-container-highest rounded-xl pr-10 pl-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface active:scale-95 transition-all"
            >
              بحث
            </button>
          </div>
        </form>

        {/* Recent Orders */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm font-headline">آخر 5 طلبات</h3>
            <button
              onClick={() => navigate("/orders")}
              className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : last5Orders.length === 0 ? (
            <p className="text-center text-xs text-on-surface-variant/60 py-8">لا توجد طلبات مسجلة بعد</p>
          ) : (
            <div className="divide-y divide-border/10">
              {last5Orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="py-3.5 flex justify-between items-center hover:bg-surface-container/30 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-on-surface-variant">طلب #{order.order_number}</p>
                    <p className="text-sm font-bold text-on-surface">{order.customer_name}</p>
                  </div>
                  <div className="text-left space-y-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <p className="text-xs font-black text-primary tabular-nums">
                      {Number(order.amount).toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NewOrderModal open={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} />
    </AppLayout>
  );
}
