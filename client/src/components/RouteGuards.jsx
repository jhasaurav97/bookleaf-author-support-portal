import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";

export function ProtectedRoute({ allowedRoles }) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate to={user.role === "ADMIN" ? "/admin" : "/author"} replace />
    );
  }

  return <Outlet />;
}

export function GuestRoute({ children }) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingScreen />;

  if (user) {
    return (
      <Navigate to={user.role === "ADMIN" ? "/admin" : "/author"} replace />
    );
  }

  return children;
}

export function HomeRedirect() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingScreen />;

  return (
    <Navigate
      to={!user ? "/login" : user.role === "ADMIN" ? "/admin" : "/author"}
      replace
    />
  );
}
