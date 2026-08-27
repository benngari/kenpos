import { Response } from "express";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import { User } from "../models";
import { signToken } from "../utils/helpers";
import { AuthedRequest } from "../middleware/auth";

export const login = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const token = signToken(String(user._id));
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      store: user.store,
    },
  });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select("-passwordHash");
  res.json(user);
});

export const listUsers = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

export const createUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { name, email, phone, password, role } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409).json({ message: "A user with that email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, passwordHash, role: role || "cashier" });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

export const updateUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { name, phone, role, isActive, password } = req.body;
  const update: Record<string, unknown> = { name, phone, role, isActive };
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(
    "-passwordHash"
  );
  res.json(user);
});

export const deleteUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});
