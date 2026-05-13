import { useState, useRef, useEffect } from "react";
import { Bell, Clock, HelpCircle, Search, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "مستخدم";
  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="flex justify-between items-center px-4 md:px-8 h-16 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-full w-96">
        <Search className="w-4 h-4 text-outline" />
        <input
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full text-on-surface mr-2 placeholder:text-on-surface-variant/50"
          placeholder="البحث عن طلبات، عملاء..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-6 mr-auto lg:mr-0">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="hover:text-primary transition-colors"><Bell className="w-5 h-5" /></button>
          <button className="hover:text-primary transition-colors"><Clock className="w-5 h-5" /></button>
          <button className="hover:text-primary transition-colors"><HelpCircle className="w-5 h-5" /></button>
        </div>
        <div className="h-8 w-px bg-outline-variant/30" />

        {/* Profile dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-left">
              <p className="text-xs font-bold text-on-surface">{displayName}</p>
              <p className="text-[10px] text-on-surface-variant">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold ring-2 ring-primary/20">
              {initial}
            </div>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 w-52 bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50 animate-fade-in">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-outline-variant/10">
                <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  <User className="w-4 h-4 text-on-surface-variant" />
                  الملف الشخصي
                </button>
                <button
                  onClick={() => { setOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  <Settings className="w-4 h-4 text-on-surface-variant" />
                  الإعدادات
                </button>
              </div>

              <div className="border-t border-outline-variant/10 py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
