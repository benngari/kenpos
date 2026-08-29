import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { useOnlineSync } from "../hooks/useOnlineSync";
import { LogOut, Wifi, WifiOff, RefreshCw, Keyboard, Hand } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

export default function Header({ title }: { title: string }) {
  const { user, logout } = useAuthStore();
  const { touchMode, toggleTouchMode } = useUiStore();
  const { status } = useOnlineSync();
  const navigate = useNavigate();

  return (
    <header
      className={clsx(
        "bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10",
        touchMode ? "h-24 px-8" : "h-16 px-6"
      )}
    >
      <h2 className={clsx("font-semibold text-slate-800", touchMode ? "text-2xl" : "text-lg")}>{title}</h2>
      <div className={clsx("flex items-center", touchMode ? "gap-6" : "gap-5")}>
        <TouchModeToggle touchMode={touchMode} onToggle={toggleTouchMode} />
        <ConnectionBadge status={status} touchMode={touchMode} />
        <div className="text-right">
          <p className={clsx("font-medium text-slate-800", touchMode ? "text-base" : "text-sm")}>{user?.name}</p>
          <p className={clsx("text-slate-500 capitalize", touchMode ? "text-sm" : "text-xs")}>{user?.role} · Main Branch</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className={clsx("rounded-lg hover:bg-slate-100 text-slate-500", touchMode ? "p-3.5" : "p-2")}
          title="Log out"
        >
          <LogOut size={touchMode ? 26 : 18} />
        </button>
      </div>
    </header>
  );
}

function TouchModeToggle({ touchMode, onToggle }: { touchMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={touchMode ? "Touch mode on — switch to keyboard/mouse mode" : "Keyboard/mouse mode — switch to touch mode"}
      className={clsx(
        "flex items-center gap-2 font-semibold rounded-full border",
        touchMode
          ? "px-5 py-3 text-base border-brand-600 bg-brand-50 text-brand-700"
          : "px-2.5 py-1.5 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
      )}
    >
      {touchMode ? <Hand size={20} /> : <Keyboard size={14} className="text-slate-500" />}
      {touchMode ? "Touch Mode" : "Keyboard Mode"}
    </button>
  );
}

function ConnectionBadge({ status, touchMode }: { status: "online" | "offline" | "syncing"; touchMode: boolean }) {
  const map = {
    online: { icon: Wifi, text: "Online", cls: "text-green-600 bg-green-50" },
    offline: { icon: WifiOff, text: "Offline", cls: "text-red-600 bg-red-50" },
    syncing: { icon: RefreshCw, text: "Syncing", cls: "text-amber-600 bg-amber-50" },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 font-medium rounded-full",
        touchMode ? "text-sm px-3.5 py-2" : "text-xs px-2.5 py-1",
        cls
      )}
    >
      <Icon size={touchMode ? 16 : 13} className={status === "syncing" ? "animate-spin" : ""} />
      {text}
    </span>
  );
}