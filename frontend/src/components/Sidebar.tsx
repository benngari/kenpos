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

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800">
        <h1 className="text-lg font-bold text-white">KenPOS</h1>
        <p className="text-xs text-slate-400">Retail Point of Sale</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {NAV.filter((item) => can(user?.role, ...item.roles)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
