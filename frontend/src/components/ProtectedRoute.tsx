import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore, can } from "../store/authStore";
import Sidebar from "./Sidebar";

export default function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, token } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !can(user.role, ...roles)) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-slate-500">
          You don't have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0">
      <Sidebar />
      <div className="flex-1 min-w-0 min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
