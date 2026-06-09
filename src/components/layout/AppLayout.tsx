import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import TopNav from "./TopNav";

export interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:mr-64 min-h-screen">
        <TopNav />
        <section className="p-4 md:p-8 space-y-6">{children}</section>
      </main>
    </div>
  );
}
