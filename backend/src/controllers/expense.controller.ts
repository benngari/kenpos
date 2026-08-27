import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Expense } from "../models";
import { AuthedRequest } from "../middleware/auth";

export const listExpenses = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to, category } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (from || to) {
    filter.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  }
  if (category) filter.category = category;
  const expenses = await Expense.find(filter).populate("user", "name").sort({ date: -1 });
  res.json(expenses);
});

export const createExpense = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const expense = await Expense.create({ ...req.body, user: req.user!.id });
  res.status(201).json(expense);
});

export const updateExpense = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(expense);
});

export const deleteExpense = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ message: "Expense deleted" });
});
