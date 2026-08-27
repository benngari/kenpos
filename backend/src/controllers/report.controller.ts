import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Sale, Expense, Product } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { round2 } from "../utils/helpers";

function rangeFilter(from?: string, to?: string) {
  if (!from && !to) return {};
  return {
    createdAt: {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    },
  };
}

export const dashboard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const dateFilter = rangeFilter(from, to);
  const sales = await Sale.find({ ...dateFilter, status: { $in: ["completed", "partially_refunded"] } });

  let cash = 0,
    mpesa = 0,
    card = 0,
    credit = 0,
    bank = 0,
    revenue = 0,
    cogs = 0,
    itemsSold = 0;

  for (const s of sales) {
    revenue += s.total;
    for (const p of s.payments) {
      if (p.method === "cash") cash += p.amount;
      else if (p.method === "mpesa") mpesa += p.amount;
      else if (p.method === "card") card += p.amount;
      else if (p.method === "bank") bank += p.amount;
      else if (p.method === "credit") credit += p.amount;
    }
    for (const item of s.items) {
      itemsSold += item.quantity;
    }
  }

  // COGS from product buying price
  const productIds = [...new Set(sales.flatMap((s) => s.items.map((i) => String(i.product))))];
  const products = await Product.find({ _id: { $in: productIds } });
  const buyMap = new Map(products.map((p) => [String(p._id), p.buyingPrice]));
  for (const s of sales) {
    for (const item of s.items) {
      cogs += (buyMap.get(String(item.product)) || 0) * item.quantity;
    }
  }

  const expenses = await Expense.find({
    ...(from || to
      ? { date: { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) } }
      : {}),
  });
  const totalExpenses = round2(expenses.reduce((s, e) => s + e.amount, 0));

  const lowStockProducts = await Product.find({ $expr: { $lte: ["$stock", "$minStock"] }, stock: { $gt: 0 } });
  const outOfStockProducts = await Product.find({ stock: { $lte: 0 } });

  res.json({
    todaySales: round2(revenue),
    grossProfit: round2(revenue - cogs),
    netProfit: round2(revenue - cogs - totalExpenses),
    transactions: sales.length,
    itemsSold,
    cashSales: round2(cash),
    mpesaSales: round2(mpesa),
    cardSales: round2(card),
    bankSales: round2(bank),
    creditSales: round2(credit),
    expenses: totalExpenses,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockProducts,
    outOfStockProducts,
  });
});

export const salesOverTime = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const rows = await Sale.aggregate([
    { $match: { ...rangeFilter(from, to), status: { $in: ["completed", "partially_refunded"] } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json(rows.map((r) => ({ date: r._id, total: round2(r.total), count: r.count })));
});

export const salesByPaymentMethod = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const rows = await Sale.aggregate([
    { $match: { ...rangeFilter(from, to), status: { $in: ["completed", "partially_refunded"] } } },
    { $unwind: "$payments" },
    { $group: { _id: "$payments.method", total: { $sum: "$payments.amount" } } },
  ]);
  res.json(rows.map((r) => ({ method: r._id, total: round2(r.total) })));
});

export const topProducts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to, limit = "10" } = req.query as Record<string, string>;
  const rows = await Sale.aggregate([
    { $match: { ...rangeFilter(from, to), status: { $in: ["completed", "partially_refunded"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: parseInt(limit, 10) },
  ]);
  res.json(rows);
});

export const salesByCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const rows = await Sale.aggregate([
    { $match: { ...rangeFilter(from, to), status: { $in: ["completed", "partially_refunded"] } } },
    { $unwind: "$items" },
    {
      $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "prod" },
    },
    { $unwind: "$prod" },
    {
      $lookup: { from: "categories", localField: "prod.category", foreignField: "_id", as: "cat" },
    },
    { $unwind: "$cat" },
    { $group: { _id: "$cat.name", total: { $sum: "$items.total" } } },
    { $sort: { total: -1 } },
  ]);
  res.json(rows.map((r) => ({ category: r._id, total: round2(r.total) })));
});

export const cashierReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const rows = await Sale.aggregate([
    { $match: { ...rangeFilter(from, to), status: { $in: ["completed", "partially_refunded"] } } },
    {
      $group: {
        _id: "$cashier",
        transactions: { $sum: 1 },
        total: { $sum: "$total" },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { name: "$user.name", transactions: 1, total: 1 } },
    { $sort: { total: -1 } },
  ]);
  res.json(rows);
});

export const profitReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const sales = await Sale.find({
    ...rangeFilter(from, to),
    status: { $in: ["completed", "partially_refunded"] },
  });
  const productIds = [...new Set(sales.flatMap((s) => s.items.map((i) => String(i.product))))];
  const products = await Product.find({ _id: { $in: productIds } });
  const buyMap = new Map(products.map((p) => [String(p._id), p.buyingPrice]));

  let revenue = 0,
    cogs = 0;
  for (const s of sales) {
    revenue += s.total;
    for (const item of s.items) {
      cogs += (buyMap.get(String(item.product)) || 0) * item.quantity;
    }
  }
  const expenses = await Expense.find(
    from || to
      ? { date: { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) } }
      : {}
  );
  const totalExpenses = round2(expenses.reduce((s, e) => s + e.amount, 0));

  res.json({
    revenue: round2(revenue),
    costOfGoods: round2(cogs),
    grossProfit: round2(revenue - cogs),
    expenses: totalExpenses,
    netProfit: round2(revenue - cogs - totalExpenses),
  });
});
