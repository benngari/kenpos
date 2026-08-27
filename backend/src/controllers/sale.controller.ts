import { Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { Sale, Product, InventoryMovement, Customer, Refund, ISaleItem, IPayment } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { generateReceiptNumber, round2 } from "../utils/helpers";

interface CartItemInput {
  product: string;
  quantity: number;
  discount?: number;
}

/** Recompute subtotal/tax/discount/total straight from the product records (never trust client totals). */
async function computeCart(cartItems: CartItemInput[], overallDiscount = 0) {
  const productIds = cartItems.map((c) => c.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const items: ISaleItem[] = [];
  let subtotal = 0;
  let tax = 0;
  let itemDiscountTotal = 0;

  for (const ci of cartItems) {
    const product = productMap.get(ci.product);
    if (!product) throw new Error(`Product ${ci.product} not found`);
    const lineDiscount = ci.discount || 0;
    const lineGross = product.sellingPrice * ci.quantity;
    const lineNet = round2(lineGross - lineDiscount);
    const lineTax = round2((lineNet * (product.taxRate || 0)) / 100);
    subtotal += lineGross;
    itemDiscountTotal += lineDiscount;
    tax += lineTax;
    items.push({
      product: product._id as any,
      name: product.name,
      quantity: ci.quantity,
      unitPrice: product.sellingPrice,
      discount: lineDiscount,
      taxRate: product.taxRate,
      total: round2(lineNet + lineTax),
    });
  }

  const discount = round2(itemDiscountTotal + overallDiscount);
  const total = round2(items.reduce((s, i) => s + i.total, 0) - overallDiscount);

  return { items, subtotal: round2(subtotal), discount, tax: round2(tax), total, productMap };
}

/** Preview endpoint: POS calls this on every cart change to show live totals without committing anything. */
export const previewCart = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { items, overallDiscount } = req.body as {
    items: CartItemInput[];
    overallDiscount?: number;
  };
  if (!items?.length) {
    res.json({ items: [], subtotal: 0, discount: 0, tax: 0, total: 0 });
    return;
  }
  const result = await computeCart(items, overallDiscount || 0);
  res.json({
    items: result.items,
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    total: result.total,
  });
});

export const checkout = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const {
    items,
    overallDiscount = 0,
    payments,
    customer,
    allowNegativeStock = false,
    registerSession,
  } = req.body as {
    items: CartItemInput[];
    overallDiscount?: number;
    payments: IPayment[];
    customer?: string;
    allowNegativeStock?: boolean;
    registerSession?: string;
  };

  if (!items?.length) {
    res.status(400).json({ message: "Cart is empty" });
    return;
  }
  if (!payments?.length) {
    res.status(400).json({ message: "At least one payment is required" });
    return;
  }

  const hasCredit = payments.some((p) => p.method === "credit");
  if (hasCredit && !customer) {
    res.status(400).json({ message: "A customer is required for credit sales" });
    return;
  }

  const cart = await computeCart(items, overallDiscount);

  // Verify stock availability
  if (!allowNegativeStock) {
    for (const ci of items) {
      const product = cart.productMap.get(ci.product);
      if (product && product.stock < ci.quantity) {
        res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
        return;
      }
    }
  }

  const amountPaid = round2(payments.reduce((s, p) => s + p.amount, 0));
  const nonCreditPaid = round2(
    payments.filter((p) => p.method !== "credit").reduce((s, p) => s + p.amount, 0)
  );
  const creditAmount = round2(payments.filter((p) => p.method === "credit").reduce((s, p) => s + p.amount, 0));

  if (round2(amountPaid) < round2(cart.total) - 0.01) {
    res.status(400).json({ message: "Amount paid is less than the sale total" });
    return;
  }

  const change = round2(Math.max(0, nonCreditPaid - (cart.total - creditAmount)));

  const session = await mongoose.startSession();
  try {
    let sale;
    await session.withTransaction(async () => {
      sale = await Sale.create(
        [
          {
            receiptNumber: generateReceiptNumber(),
            items: cart.items,
            subtotal: cart.subtotal,
            discount: cart.discount,
            tax: cart.tax,
            total: cart.total,
            amountPaid,
            change,
            payments,
            customer: customer || undefined,
            cashier: req.user!.id,
            status: "completed",
            registerSession: registerSession || undefined,
          },
        ],
        { session }
      );
      sale = sale[0];

      for (const ci of items) {
        await Product.updateOne(
          { _id: ci.product },
          { $inc: { stock: -ci.quantity } },
          { session }
        );
        await InventoryMovement.create(
          [
            {
              product: ci.product,
              type: "sale",
              quantity: -ci.quantity,
              reference: sale!.receiptNumber,
              user: req.user!.id,
            },
          ],
          { session }
        );
      }

      if (creditAmount > 0 && customer) {
        await Customer.updateOne(
          { _id: customer },
          { $inc: { balance: creditAmount } },
          { session }
        );
      }
    });

    res.status(201).json(sale);
  } finally {
    session.endSession();
  }
});

export const holdSale = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { items, overallDiscount = 0, customer, holdReference } = req.body as {
    items: CartItemInput[];
    overallDiscount?: number;
    customer?: string;
    holdReference: string;
  };
  const cart = await computeCart(items, overallDiscount);
  const sale = await Sale.create({
    receiptNumber: generateReceiptNumber(),
    items: cart.items,
    subtotal: cart.subtotal,
    discount: cart.discount,
    tax: cart.tax,
    total: cart.total,
    amountPaid: 0,
    change: 0,
    payments: [],
    customer: customer || undefined,
    cashier: req.user!.id,
    status: "held",
    holdReference,
  });
  res.status(201).json(sale);
});

export const listHeldSales = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const held = await Sale.find({ status: "held" }).populate("customer", "name").sort({ createdAt: -1 });
  res.json(held);
});

export const deleteHeldSale = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await Sale.findOneAndDelete({ _id: req.params.id, status: "held" });
  res.json({ message: "Held sale deleted" });
});

export const listSales = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to, cashier, paymentMethod, customer, status, page = "1", limit = "20" } =
    req.query as Record<string, string>;
  const filter: Record<string, unknown> = { status: { $ne: "held" } };
  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }
  if (cashier) filter.cashier = cashier;
  if (customer) filter.customer = customer;
  if (status) filter.status = status;
  if (paymentMethod) filter["payments.method"] = paymentMethod;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [items, total] = await Promise.all([
    Sale.find(filter)
      .populate("cashier", "name")
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Sale.countDocuments(filter),
  ]);
  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

export const getSale = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sale = await Sale.findById(req.params.id)
    .populate("cashier", "name")
    .populate("customer", "name phone");
  if (!sale) {
    res.status(404).json({ message: "Sale not found" });
    return;
  }
  res.json(sale);
});

export const voidSale = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale || sale.status !== "completed") {
    res.status(400).json({ message: "Only a completed sale can be voided" });
    return;
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of sale.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session }
        );
        await InventoryMovement.create(
          [
            {
              product: item.product,
              type: "return",
              quantity: item.quantity,
              reference: sale.receiptNumber,
              reason: "Sale voided",
              user: req.user!.id,
            },
          ],
          { session }
        );
      }
      sale.status = "voided";
      await sale.save({ session });
    });
    res.json(sale);
  } finally {
    session.endSession();
  }
});

export const refundSale = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { items, reason } = req.body as {
    items: { product: string; quantity: number }[];
    reason: string;
  };
  const sale = await Sale.findById(req.params.id);
  if (!sale || (sale.status !== "completed" && sale.status !== "partially_refunded")) {
    res.status(400).json({ message: "This sale cannot be refunded" });
    return;
  }

  const session = await mongoose.startSession();
  try {
    let refund;
    let totalRefunded = 0;
    const refundItems: { product: any; name: string; quantity: number; amount: number }[] = [];

    await session.withTransaction(async () => {
      for (const ri of items) {
        const saleItem = sale.items.find((i) => String(i.product) === ri.product);
        if (!saleItem) throw new Error("Item not part of this sale");
        const lineAmount = round2((saleItem.total / saleItem.quantity) * ri.quantity);
        totalRefunded += lineAmount;
        refundItems.push({
          product: saleItem.product,
          name: saleItem.name,
          quantity: ri.quantity,
          amount: lineAmount,
        });
        await Product.updateOne(
          { _id: ri.product },
          { $inc: { stock: ri.quantity } },
          { session }
        );
        await InventoryMovement.create(
          [
            {
              product: ri.product,
              type: "return",
              quantity: ri.quantity,
              reference: sale.receiptNumber,
              reason: reason || "Customer return",
              user: req.user!.id,
            },
          ],
          { session }
        );
      }

      refund = await Refund.create(
        [
          {
            sale: sale._id,
            items: refundItems,
            reason,
            totalRefunded: round2(totalRefunded),
            processedBy: req.user!.id,
          },
        ],
        { session }
      );
      refund = refund[0];

      const fullyRefunded = round2(totalRefunded) >= round2(sale.total) - 0.01;
      sale.status = fullyRefunded ? "refunded" : "partially_refunded";
      await sale.save({ session });
    });

    res.status(201).json(refund);
  } finally {
    session.endSession();
  }
});
