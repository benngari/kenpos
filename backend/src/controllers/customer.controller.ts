import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Customer, Sale } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { round2 } from "../utils/helpers";

export const listCustomers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q } = req.query as Record<string, string>;
  const filter = q
    ? { $or: [{ name: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }] }
    : {};
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json(customers);
});

export const createCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await Customer.findByIdAndDelete(req.params.id);
  res.json({ message: "Customer deleted" });
});

export const customerStatement = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }
  const sales = await Sale.find({ customer: customer._id }).sort({ createdAt: -1 });
  const totalSpent = round2(
    sales.filter((s) => s.status !== "voided").reduce((sum, s) => sum + s.total, 0)
  );
  res.json({ customer, sales, totalSpent, outstandingBalance: customer.balance });
});

/** Record a payment against a customer's outstanding credit balance. */
export const recordCreditPayment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { amount } = req.body as { amount: number };
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }
  customer.balance = round2(Math.max(0, customer.balance - amount));
  await customer.save();
  res.json(customer);
});
