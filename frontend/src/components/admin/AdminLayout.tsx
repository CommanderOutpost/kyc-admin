import { Outlet } from "react-router-dom";
import { TopBar } from "../TopBar";
import { useAdmin } from "../../context/AdminContext";
import { AdminSidebar } from "./AdminSidebar";

export const AdminLayout = () => {
  const { loading } = useAdmin();

  return (
    <main className="admin-layout">
      <AdminSidebar />

      <section className="admin-content">
        <TopBar title="Operations Dashboard" subtitle="Manage onboarding, KYC, subscriptions, webhooks, and audits" />

        {loading && <p className="subtle">Refreshing admin data...</p>}

        <Outlet />
      </section>
    </main>
  );
};
