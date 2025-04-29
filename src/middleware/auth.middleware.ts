import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import User from "../models/user.model";

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Add explicit void return type
  const token = req.cookies[config.cookieSettings.name];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret!) as DecodedToken;
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
      return;
    }

    next();
  };
};
