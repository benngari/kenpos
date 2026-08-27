import { Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { Purchase, Product, InventoryMovement, Supplier } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { round2 } from "../utils/helpers";

export const listPurchases = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status, supplier } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (supplier) filter.supplier = supplier;
  const purchases = await Purchase.find(filter)
    .populate("supplier", "name")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });
  res.json(purchases);
});

export const createPurchase = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { supplier, invoiceNumber, items } = req.body as {
    supplier: string;
    invoiceNumber: string;
    items: { product: string; name: string; quantity: number; buyingPrice: number }[];
  };
  const total = round2(items.reduce((s, i) => s + i.quantity * i.buyingPrice, 0));
  const purchase = await Purchase.create({
    supplier,
    invoiceNumber,
    items: items.map((i) => ({ ...i, total: round2(i.quantity * i.buyingPrice) })),
    total,
    status: "pending",
    createdBy: req.user!.id,
  });
  res.status(201).json(purchase);
});

/** Mark a pending purchase as received: increases stock and creates inventory movements. */
export const receivePurchase = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase || purchase.status !== "pending") {
    res.status(400).json({ message: "Only a pending purchase can be received" });
    return;
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of purchase.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity }, $set: { buyingPrice: item.buyingPrice } },
          { session }
        );
        await InventoryMovement.create(
          [
            {
              product: item.product,
              type: "purchase",
              quantity: item.quantity,
              reference: purchase.invoiceNumber,
              user: req.user!.id,
            },
          ],
          { session }
        );
      }
      await Supplier.updateOne(
        { _id: purchase.supplier },
        { $inc: { balance: purchase.total } },
        { session }
      );
      purchase.status = "received";
      purchase.receivedAt = new Date();
      await purchase.save({ session });
    });
    res.json(purchase);
  } finally {
    session.endSession();
  }
});

export const cancelPurchase = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase || purchase.status !== "pending") {
    res.status(400).json({ message: "Only a pending purchase can be cancelled" });
    return;
  }
  purchase.status = "cancelled";
  await purchase.save();
  res.json(purchase);
});
