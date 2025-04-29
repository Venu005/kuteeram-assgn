import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/error.middleware";
import Seller from "./seller.model";
import Product from "../models/product.model";
import Order from "../models/order.model";
import mongoose from "mongoose";
import { generateOTP } from "../utils/location.utils";

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const seller = await Seller.findById(req.user.id).select("-password");

    if (!seller) {
      return next(new AppError("Seller not found", 404));
    }

    res.status(200).json({
      success: true,
      data: seller,
    });
  } catch (error) {
    next(error);
  }
};

// Update seller profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, millName, city, district, location, address } = req.body;

    // Build update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (millName) updateData.millName = millName;
    if (city) updateData.city = city;
    if (district) updateData.district = district;
    if (address) updateData.address = address;

    if (location && location.coordinates) {
      updateData.location = {
        type: "Point",
        coordinates: location.coordinates,
      };
    }

    // Update seller
    const seller = await Seller.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!seller) {
      return next(new AppError("Seller not found", 404));
    }

    res.status(200).json({
      success: true,
      data: seller,
    });
  } catch (error) {
    next(error);
  }
};

// Get seller dashboard
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get seller products
    const products = await Product.find({ seller: req.user.id });

    // Get seller orders
    const orders = await Order.find({ seller: req.user.id })
      .populate("buyer", "name phone")
      .populate("product", "productType quantity price")
      .populate("lorry", "name phone agencyName vehicleNumber");

    // Calculate total stock
    const stockByType: { [key: string]: number } = {};
    const availableStockByType: { [key: string]: number } = {};

    products.forEach((product) => {
      const type = product.productType;

      if (!stockByType[type]) {
        stockByType[type] = 0;
        availableStockByType[type] = 0;
      }

      stockByType[type] += product.quantity;

      if (product.isAvailable) {
        availableStockByType[type] += product.quantity;
      }
    });

    // Organize orders by status
    const ordersByStatus = {
      pending: orders.filter((order) => order.status === "pending"),
      paid: orders.filter((order) => order.status === "paid"),
      shipped: orders.filter((order) => order.status === "shipped"),
      delivered: orders.filter((order) => order.status === "delivered"),
      cancelled: orders.filter((order) => order.status === "cancelled"),
    };

    res.status(200).json({
      success: true,
      data: {
        totalProducts: products.length,
        stockByType,
        availableStockByType,
        recentOrders: orders.slice(0, 5),
        ordersByStatus,
        orderCount: orders.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify pickup OTP
export const verifyPickupOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, otp } = req.body;
    const now = new Date();

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      seller: req.user.id,
      status: "paid",
      isPicked: false,
    });

    if (!order) {
      return next(new AppError("Order not found or already picked up", 404));
    }

    // Check if OTP expired
    if (order && order.pickupOTPExpires! < now) {
      // Generate new OTP
      const newOTP = generateOTP();

      order.pickupOTP = newOTP;
      order.pickupOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await order.save();

      return next(
        new AppError("OTP expired. New OTP has been generated and sent", 400)
      );
    }

    if (order.pickupOTP !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    // If valid OTP, mark as picked
    order.isPicked = true;
    order.status = "shipped";
    order.pickupOTP = undefined;
    order.pickupOTPExpires = undefined;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Pickup verified successfully",
      data: {
        orderId: order._id,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// controllers/seller.controller.ts
