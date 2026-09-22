import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminLogin, { isAdminSignedIn } from "./AdminLogin";

export default function AdminLayout() {
  const [signedIn, setSignedIn] = useState(isAdminSignedIn);

  if (!signedIn) return <AdminLogin onSuccess={() => setSignedIn(true)} />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="min-w-0">
          <AdminHeader />
          <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <Outlet />  
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
