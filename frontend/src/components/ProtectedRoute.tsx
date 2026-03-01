import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export const ProtectedRoute = ({
  children,
  allow
}: {
  children: ReactElement;
  allow?: UserRole[];
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-note">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/portal"} replace />;
  }

  return children;
};
