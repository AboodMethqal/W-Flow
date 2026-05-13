import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  Headphones,
  UserCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "نظرة عامة", icon: LayoutDashboard, path: "/" },
  { label: "لوحة الطلبات الذكية", icon: ClipboardCheck, path: "/orders" },
  { label: "قاعدة بيانات العملاء", icon: Users, path: "/customers" },
  { label: "التحليلات", icon: BarChart3, path: "/analytics" },
  { label: "الإعدادات", icon: Settings, path: "/settings" },
];

interface AppSidebarProps {
  onNewOrder: () => void;
}

export default function AppSidebar({ onNewOrder }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "مستخدم";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/auth");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full py-6">
      {/* Brand */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
          <span className="text-primary-container-foreground font-black text-lg">W</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tighter leading-none font-headline">
            W-Flow
          </h1>
          <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest mt-1">
            CRM & Order Management
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-primary border-r-4 border-primary-container bg-gradient-to-l from-primary-container/10 to-transparent"
                  : "text-on-surface/60 hover:text-on-surface hover:bg-surface-container-highest rounded-xl"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 mt-auto space-y-2">
        <button
          onClick={() => {
            onNewOrder();
            setMobileOpen(false);
          }}
          className="w-full gradient-primary text-primary-container-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-6 shadow-lg hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-5 h-5" />
          <span>طلب جديد</span>
        </button>
        <Link
          to="#"
          className="flex items-center gap-4 px-4 py-3 text-on-surface/60 hover:text-on-surface transition-colors"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-sm">الدعم</span>
        </Link>
        <Link
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-4 px-4 py-3 text-on-surface/60 hover:text-on-surface transition-colors rounded-xl hover:bg-surface-container-highest"
        >
          <UserCircle className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-[10px] text-on-surface-variant truncate max-w-[130px]">{user?.email}</span>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-[60] w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5 text-primary-container-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed right-0 top-0 h-screen w-64 bg-surface-container-lowest shadow-[4px_0_24px_rgba(0,0,0,0.3)] z-[70] transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 left-4 text-on-surface/60 hover:text-on-surface"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed right-0 top-0 h-screen w-64 bg-surface-container-lowest shadow-[4px_0_24px_rgba(0,0,0,0.3)] z-50">
        {sidebarContent}
      </aside>
    </>
  );
}
