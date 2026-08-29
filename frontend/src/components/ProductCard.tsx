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
        "flex flex-col text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-brand-500 hover:shadow-sm transition-all active:scale-[0.97]",
        outOfStock && "opacity-40 cursor-not-allowed hover:border-slate-200"
      )}
    >
      <div className={clsx("bg-slate-100 flex items-center justify-center overflow-hidden", touchMode ? "h-28" : "h-20")}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-slate-300" size={touchMode ? 36 : 28} />
        )}
      </div>
      <div className={touchMode ? "p-3.5" : "p-2.5"}>
        <p className={clsx("font-medium text-slate-800 line-clamp-2 leading-tight", touchMode ? "text-base" : "text-sm")}>
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className={clsx("font-bold text-brand-700", touchMode ? "text-base" : "text-sm")}>
            KES {product.sellingPrice.toFixed(0)}
          </span>
          <span className={clsx("font-medium", outOfStock ? "text-red-500" : "text-slate-400", touchMode ? "text-xs" : "text-[11px]")}>
            {outOfStock ? "Out of stock" : `${product.stock} ${product.unit}`}
          </span>
        </div>
      </div>
    </button>
  );
}