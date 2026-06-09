import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import Dashboard from "./pages/Dashboard";
import OrdersKanban from "./pages/OrdersKanban";
import OrderDetails from "./pages/OrderDetails";
import ProductsPage from "./pages/Products";
import StorePage from "./pages/StorePage";
import ProductPage from "./pages/ProductPage";
import AddOrderPage from "./pages/AddOrder";
import SettingsPage from "./pages/Settings";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function CatalogRedirect() {
  const params = new URLSearchParams(window.location.search);
  // Extract slug from URL path: /catalog/:slug
  const slug = window.location.pathname.split("/catalog/")[1]?.split("/")[0] || params.get("slug") || "";
  return <Navigate to={`/store/${slug}`} replace />;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/auth" replace />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><OrdersKanban /></ProtectedRoute>} />
    <Route path="/orders/new" element={<ProtectedRoute><AddOrderPage /></ProtectedRoute>} />
    <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
    <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/store/:slug" element={<StorePage />} />
    <Route path="/store/:slug/product/:id" element={<ProductPage />} />
    <Route path="/catalog/:slug" element={<CatalogRedirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
