import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

const navItems = [
  { label: "الرئيسية", icon: LayoutDashboard, path: "/app" },
  { label: "لوحة الطلبات", icon: ClipboardCheck, path: "/orders" },
  { label: "المنتجات", icon: Package, path: "/products" },
  { label: "الإعدادات", icon: Settings, path: "/settings" },
];

interface AppSidebarProps {
  onNewOrder?: () => void;
}

export default function AppSidebar({ onNewOrder }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = currentWorkspace?.name || user?.email?.split("@")[0] || "تاجر";

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
            إدارة طلبات التاجر
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
              className={`flex items-center gap-4 px-4 py-3.5 transition-all duration-200 active:scale-95 rounded-xl ${
                isActive
                  ? "text-primary bg-primary/10 font-bold"
                  : "text-on-surface/60 hover:text-on-surface hover:bg-surface-container-highest"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 mt-auto">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-highest">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-on-surface truncate">{displayName}</span>
            <span className="text-[10px] text-on-surface-variant truncate max-w-[120px]">{user?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
