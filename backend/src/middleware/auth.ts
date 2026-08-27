import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, RoleName } from "../models";

export interface AuthedRequest extends Request {
  user?: { id: string; role: RoleName; name: string; store?: string };
}

export async function protect(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      store: user.store ? String(user.store) : undefined,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Restrict a route to one or more roles. Admin is implicitly always allowed. */
export function permit(...roles: RoleName[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role === "admin" || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: "You do not have permission to do this" });
  };
}
