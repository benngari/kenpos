import { useAuthStore } from "../store/authStore";
import { useOnlineSync } from "../hooks/useOnlineSync";
import { LogOut, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ title }: { title: string }) {
  const { user, logout } = useAuthStore();
  const { status } = useOnlineSync();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-5">
        <ConnectionBadge status={status} />
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role} · Main Branch</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

function ConnectionBadge({ status }: { status: "online" | "offline" | "syncing" }) {
  const map = {
    online: { icon: Wifi, text: "Online", cls: "text-green-600 bg-green-50" },
    offline: { icon: WifiOff, text: "Offline", cls: "text-red-600 bg-red-50" },
    syncing: { icon: RefreshCw, text: "Syncing", cls: "text-amber-600 bg-amber-50" },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      <Icon size={13} className={status === "syncing" ? "animate-spin" : ""} />
      {text}
    </span>
  );
}
