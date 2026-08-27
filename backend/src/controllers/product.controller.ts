import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Product, InventoryMovement } from "../models";
import { AuthedRequest } from "../middleware/auth";

export const listProducts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q, category, status, page = "1", limit = "20", lowStock } = req.query as Record<
    string,
    string
  >;
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { barcode: { $regex: q, $options: "i" } },
    ];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (lowStock === "true") filter.$expr = { $lte: ["$stock", "$minStock"] };

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("supplier", "name")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

export const getProductByBarcode = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const product = await Product.findOne({
    $or: [{ barcode: req.params.code }, { sku: req.params.code }],
  }).populate("category", "name");
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});

export const createProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const product = await Product.create(req.body);
  await InventoryMovement.create({
    product: product._id,
    type: "in",
    quantity: product.stock,
    reason: "Initial stock on product creation",
    user: req.user!.id,
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

export const bulkUpdateStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { ids, status } = req.body as { ids: string[]; status: string };
  await Product.updateMany({ _id: { $in: ids } }, { status });
  res.json({ message: `${ids.length} product(s) updated` });
});
