import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export const TopBar = ({
  title,
  subtitle,
  actions
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">KYC ADMIN PORTAL</p>
        <h1>{title || (user?.role === "ADMIN" ? "Operations Dashboard" : "Customer Portal")}</h1>
        {subtitle && <p className="subtle">{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        <span>{user?.email}</span>
        {actions}
      </div>
    </header>
  );
};
