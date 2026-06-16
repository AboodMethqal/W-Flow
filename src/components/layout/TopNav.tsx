import { useState, useRef, useEffect } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const { user, signOut } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const displayName = currentWorkspace?.name || user?.email?.split("@")[0] || "تاجر";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Direct navigation if number is entered, otherwise go to kanban with filter
      const num = Number(searchQuery.trim());
      if (!isNaN(num)) {
        navigate(`/orders?search=${num}`);
      } else {
        navigate(`/orders?search=${searchQuery.trim()}`);
      }
    }
  };

  return (
    <header className="flex justify-between items-center px-4 md:px-8 h-16 sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/10">
      <form onSubmit={handleSearch} className="flex items-center bg-surface-container-low px-4 py-2 rounded-xl w-60 md:w-96">
        <Search className="w-4 h-4 text-outline" />
        <input
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full text-on-surface mr-2 placeholder:text-on-surface-variant/40"
          placeholder="البحث برقم الطلب..."
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="flex items-center gap-6 mr-auto lg:mr-0">
        {/* Profile dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-on-surface">{displayName}</p>
              <p className="text-[10px] text-on-surface-variant">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold ring-2 ring-primary/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 w-52 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-outline-variant/10">
                <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
              </div>

              <div className="py-1">
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
