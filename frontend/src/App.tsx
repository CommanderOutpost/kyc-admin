import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProvider } from "./context/AdminContext";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { CustomersPage } from "./pages/admin/CustomersPage";
import { KycPage } from "./pages/admin/KycPage";
import { OverviewPage } from "./pages/admin/OverviewPage";
import { SubscriptionsPage } from "./pages/admin/SubscriptionsPage";
import { WebhooksPage } from "./pages/admin/WebhooksPage";
import { UserPortalPage } from "./pages/UserPortalPage";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-note">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/portal"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminProvider>
              <AdminLayout />
            </AdminProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="kyc" element={<KycPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
      </Route>
      <Route
        path="/portal"
        element={
          <ProtectedRoute allow={["USER"]}>
            <UserPortalPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
