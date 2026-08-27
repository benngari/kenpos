import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Category, Product } from "../models";
import { AuthedRequest } from "../middleware/auth";

export const listCategories = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(
    categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) || 0 }))
  );
});

export const createCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    res.status(400).json({ message: `Cannot delete: ${inUse} product(s) use this category` });
    return;
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category deleted" });
});
