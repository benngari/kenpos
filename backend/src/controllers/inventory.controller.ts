import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Product, InventoryMovement } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { round2 } from "../utils/helpers";

export const inventorySummary = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const products = await Product.find().populate("category", "name");
  const stockValue = round2(products.reduce((s, p) => s + p.stock * p.buyingPrice, 0));
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const outOfStock = products.filter((p) => p.stock <= 0);
  res.json({
    totalProducts: products.length,
    stockValue,
    lowStock,
    outOfStock,
    products,
  });
});

export const listMovements = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { product, type, page = "1", limit = "30" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (product) filter.product = product;
  if (type) filter.type = type;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const [items, total] = await Promise.all([
    InventoryMovement.find(filter)
      .populate("product", "name sku")
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    InventoryMovement.countDocuments(filter),
  ]);
  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

/** Generic manual movement: stock-in, stock-out (damage/loss/expiry), or adjustment/transfer. */
export const createMovement = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { product, type, quantity, reason } = req.body as {
    product: string;
    type: "in" | "out" | "adjustment" | "transfer";
    quantity: number;
    reason?: string;
  };

  const prod = await Product.findById(product);
  if (!prod) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  let delta = 0;
  if (type === "in") delta = Math.abs(quantity);
  else if (type === "out") delta = -Math.abs(quantity);
  else delta = quantity; // adjustment / transfer: quantity carries its own sign

  if (prod.stock + delta < 0) {
    res.status(400).json({ message: "Resulting stock cannot be negative" });
    return;
  }

  prod.stock += delta;
  await prod.save();

  const movement = await InventoryMovement.create({
    product,
    type,
    quantity: delta,
    reason,
    user: req.user!.id,
  });
  res.status(201).json({ movement, product: prod });
});
