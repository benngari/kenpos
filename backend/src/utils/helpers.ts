import jwt, { SignOptions } from "jsonwebtoken";

export function signToken(id: string): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"],
  };
  return jwt.sign({ id }, process.env.JWT_SECRET as string, options);
}

/** Generates a receipt number like RCT-20260827-0001 style using timestamp + random suffix. */
export function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCT-${y}${m}${d}-${rand}`;
}

export function generateInvoiceRef(prefix: string): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${rand}`;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
