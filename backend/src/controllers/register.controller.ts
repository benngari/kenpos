import { Response } from "express";
import asyncHandler from "express-async-handler";
import { RegisterSession, Sale } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { round2 } from "../utils/helpers";

export const currentSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const session = await RegisterSession.findOne({ cashier: req.user!.id, status: "open" });
  res.json(session);
});

export const openSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await RegisterSession.findOne({ cashier: req.user!.id, status: "open" });
  if (existing) {
    res.status(400).json({ message: "You already have an open register session" });
    return;
  }
  const { openingCash } = req.body as { openingCash: number };
  const session = await RegisterSession.create({ cashier: req.user!.id, openingCash });
  res.status(201).json(session);
});

export const closeSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const session = await RegisterSession.findById(req.params.id);
  if (!session || session.status !== "open") {
    res.status(400).json({ message: "Session already closed or not found" });
    return;
  }
  const { closingCash } = req.body as { closingCash: number };

  const sales = await Sale.find({ registerSession: session._id, status: "completed" });
  const cashSales = round2(
    sales.reduce(
      (sum, s) => sum + s.payments.filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0),
      0
    )
  );
  const expectedCash = round2(session.openingCash + cashSales);

  session.closingCash = closingCash;
  session.expectedCash = expectedCash;
  session.difference = round2(closingCash - expectedCash);
  session.status = "closed";
  session.closedAt = new Date();
  await session.save();

  const byMethod: Record<string, number> = {};
  for (const s of sales) {
    for (const p of s.payments) {
      byMethod[p.method] = round2((byMethod[p.method] || 0) + p.amount);
    }
  }

  res.json({ session, summary: { totalSales: sales.length, byMethod } });
});

export const listSessions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { cashier } = req.query as Record<string, string>;
  const filter = cashier ? { cashier } : {};
  const sessions = await RegisterSession.find(filter).populate("cashier", "name").sort({ openedAt: -1 });
  res.json(sessions);
});
