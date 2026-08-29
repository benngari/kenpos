import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  Receipt,
  Truck,
  Users,
  Building2,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
} from "lucide-react";
import { useAuthStore, can } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import clsx from "clsx";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "cashier"] },
  { to: "/pos", label: "Point of Sale", icon: ShoppingCart, roles: ["admin", "manager", "cashier"] },
  { to: "/register", label: "Register / Shift", icon: Wallet, roles: ["admin", "manager", "cashier"] },
  { to: "/products", label: "Products", icon: Package, roles: ["admin", "manager"] },
  { to: "/categories", label: "Categories", icon: Tags, roles: ["admin", "manager"] },
  { to: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "manager"] },
  { to: "/sales", label: "Sales", icon: Receipt, roles: ["admin", "manager", "cashier"] },
  { to: "/purchases", label: "Purchases", icon: Truck, roles: ["admin", "manager"] },
  { to: "/customers", label: "Customers", icon: Users, roles: ["admin", "manager", "cashier"] },
  { to: "/suppliers", label: "Suppliers", icon: Building2, roles: ["admin", "manager"] },
  { to: "/expenses", label: "Expenses", icon: Wallet, roles: ["admin", "manager"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "manager"] },
  { to: "/users", label: "Users & Roles", icon: UserCog, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager"] },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { touchMode } = useUiStore();

  return (
    <aside
      className={clsx(
        "shrink-0 bg-slate-900 text-slate-200 h-screen sticky top-0 flex flex-col transition-all",
        touchMode ? "w-24" : "w-60"
      )}
    >
      <div className={clsx("border-b border-slate-800", touchMode ? "px-3 py-5 text-center" : "px-5 py-4")}>
        <h1 className={clsx("font-bold text-white", touchMode ? "text-base" : "text-lg")}>
          {touchMode ? "KP" : "KenPOS"}
        </h1>
        {!touchMode && <p className="text-xs text-slate-400">Retail Point of Sale</p>}
      </div>
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {NAV.filter((item) => can(user?.role, ...item.roles)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={touchMode ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                "flex font-medium transition-colors",
                touchMode
                  ? "flex-col items-center justify-center gap-1.5 px-2 py-4 text-[11px] text-center"
                  : "flex-row items-center gap-3 px-5 py-2.5 text-sm",
                isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon size={touchMode ? 26 : 18} />
            <span className={touchMode ? "leading-tight" : undefined}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}