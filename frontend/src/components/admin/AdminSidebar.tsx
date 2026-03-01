import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiDatabase,
  FiFileText,
  FiLayers,
  FiLogOut,
  FiShield,
  FiUsers
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/admin/overview", label: "Overview", icon: FiActivity },
  { to: "/admin/customers", label: "Customers", icon: FiUsers },
  { to: "/admin/kyc", label: "KYC", icon: FiShield },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: FiLayers },
  { to: "/admin/webhooks", label: "Webhooks", icon: FiDatabase },
  { to: "/admin/audit", label: "Audit Logs", icon: FiFileText }
];

export const AdminSidebar = () => {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem("admin-sidebar-collapsed") === "true");

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-head">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        <div className="sidebar-brand">
          <p className="eyebrow sidebar-label">FONU OPS</p>
          <h2 className="sidebar-label">Admin Console</h2>
        </div>
      </div>

      <nav className="side-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
            title={item.label}
          >
            <item.icon className="side-icon" />
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="side-actions">
        <a className="side-link side-ghost" href="http://localhost:4000/docs" target="_blank" rel="noreferrer" title="Open Swagger Docs">
          <FiFileText className="side-icon" />
          <span className="sidebar-label">Swagger Docs</span>
        </a>
        <button className="side-link side-ghost side-logout" onClick={logout} title="Logout">
          <FiLogOut className="side-icon" />
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};
