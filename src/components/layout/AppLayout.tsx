import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import TopNav from "./TopNav";

export interface AppLayoutProps {
  children: ReactNode;
  onNewOrder?: () => void;
}

export default function AppLayout({ children, onNewOrder }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar onNewOrder={onNewOrder} />
      <main className="lg:mr-64 min-h-screen">
        <TopNav />
        <section className="p-4 md:p-8 space-y-8">{children}</section>
      </main>
    </div>
  );
}
