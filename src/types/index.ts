import jwt from "jsonwebtoken";
import { Document } from "mongoose";

// types/index.ts
export interface DecodedToken extends jwt.JwtPayload {
  id: string;
  role: string;
}

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: "seller" | "buyer" | "lorry";
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ISeller extends IUser {
  millName: string;
  city: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  district: string;
  address?: string;
}

export interface IBuyer extends IUser {
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface ILorry extends IUser {
  agencyName: string;
  vehicleNumber?: string;
  currentLocation?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  isAvailable: boolean;
}

export interface IProduct extends Document {
  seller: ISeller["_id"];
  productType: string;
  quantity: number;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBid extends Document {
  buyer: IBuyer["_id"];
  product: IProduct["_id"];
  bidPrice: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  buyer: IBuyer["_id"];
  seller: ISeller["_id"];
  product: IProduct["_id"];
  bid: IBid["_id"];
  quantity: number;
  price: number;
  commission: number;
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  lorry?: ILorry["_id"];
  pickupOTP?: string;
  pickupOTPExpires?: Date;
  isPicked: boolean;
  isDelivered: boolean;
  createdAt: Date;
  updatedAt: Date;
}
