import { Product } from "../types";
import { Package } from "lucide-react";
import clsx from "clsx";

export default function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const outOfStock = product.stock <= 0;
  return (
    <button
      onClick={onClick}
      disabled={outOfStock}
      className={clsx(
        "flex flex-col text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-brand-500 hover:shadow-sm transition-all active:scale-[0.98]",
        outOfStock && "opacity-40 cursor-not-allowed hover:border-slate-200"
      )}
    >
      <div className="h-20 bg-slate-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-slate-300" size={28} />
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight">{product.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-brand-700">KES {product.sellingPrice.toFixed(0)}</span>
          <span className={clsx("text-[11px] font-medium", outOfStock ? "text-red-500" : "text-slate-400")}>
            {outOfStock ? "Out of stock" : `${product.stock} ${product.unit}`}
          </span>
        </div>
      </div>
    </button>
  );
}
