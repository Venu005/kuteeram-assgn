import jwt from "jsonwebtoken";
import config from "../config/config";
import { IUser } from "../types";
import { Response } from "express";

declare module "jsonwebtoken" {
  export interface JwtPayload {
    role: string;
  }
}
export const generateToken = (user: IUser): string => {
  return jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: "1d",
  });
};

// not using wwill see if it is needed later
export const setAuthCookie = (res: Response, user: IUser): void => {
  const token = generateToken(user);
  res.cookie(config.cookieSettings.name, token, config.cookieSettings);
};
