import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Supplier, Purchase } from "../models";
import { AuthedRequest } from "../middleware/auth";

export const listSuppliers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q } = req.query as Record<string, string>;
  const filter = q ? { name: { $regex: q, $options: "i" } } : {};
  const suppliers = await Supplier.find(filter).sort({ createdAt: -1 });
  res.json(suppliers);
});

export const createSupplier = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
});

export const updateSupplier = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ message: "Supplier deleted" });
});

export const supplierHistory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404).json({ message: "Supplier not found" });
    return;
  }
  const purchases = await Purchase.find({ supplier: supplier._id }).sort({ createdAt: -1 });
  res.json({ supplier, purchases });
});
