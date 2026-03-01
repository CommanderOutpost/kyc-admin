import { Outlet } from "react-router-dom";
import { TopBar } from "../TopBar";
import { useAdmin } from "../../context/AdminContext";
import { AdminSidebar } from "./AdminSidebar";

export const AdminLayout = () => {
  const { error, loading } = useAdmin();

  return (
    <main className="admin-layout">
      <AdminSidebar />

      <section className="admin-content">
        <TopBar title="Operations Dashboard" subtitle="Manage onboarding, KYC, subscriptions, webhooks, and audits" />

        {error && <p className="error-note">{error}</p>}
        {loading && <p className="subtle">Refreshing admin data...</p>}

        <Outlet />
      </section>
    </main>
  );
};
