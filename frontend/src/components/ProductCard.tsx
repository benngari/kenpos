import { Product } from "../types";
import { Package } from "lucide-react";
import clsx from "clsx";
import { useUiStore } from "../store/uiStore";

export default function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const { touchMode } = useUiStore();
  const outOfStock = product.stock <= 0;
  return (
    <button
      onClick={onClick}
      disabled={outOfStock}
      className={clsx(
        "flex flex-col text-left bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-brand-500 dark:hover:border-brand-500 active:scale-[0.96] transition-all",
        touchMode ? "shadow-sm" : "hover:shadow-sm",
        outOfStock && "opacity-40 cursor-not-allowed hover:border-slate-200 dark:hover:border-slate-700"
      )}
    >
      <div className={clsx("bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden", touchMode ? "h-36" : "h-20")}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-slate-300 dark:text-slate-500" size={touchMode ? 44 : 28} />
        )}
      </div>
      <div className={touchMode ? "p-4" : "p-2.5"}>
        <p className={clsx("font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight", touchMode ? "text-lg" : "text-sm")}>
          {product.name}
        </p>
        <div className={clsx("flex items-center justify-between", touchMode ? "mt-2.5" : "mt-1.5")}>
          <span className={clsx("font-bold text-brand-700 dark:text-brand-400", touchMode ? "text-xl" : "text-sm")}>
            KES {product.sellingPrice.toFixed(0)}
          </span>
          <span
            className={clsx(
              "font-medium",
              outOfStock ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500",
              touchMode ? "text-sm" : "text-[11px]"
            )}
          >
            {outOfStock ? "Out of stock" : `${product.stock} ${product.unit}`}
          </span>
        </div>
      </div>
    </button>
  );
}
