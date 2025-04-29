import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/error.middleware";
import Lorry from "./lorry.model";
import Order from "../models/order.model";
import Seller from "../seller/seller.model";
import User from "../models/user.model";

// Accept order for delivery
export const acceptOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.body;

    // Check if lorry is available
    const lorry = await Lorry.findById(req.user.id);

    if (!lorry || !lorry.isAvailable) {
      return next(new AppError("Lorry not available for orders", 400));
    }

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      status: "paid",
      lorry: { $exists: false },
      isPicked: false,
    });

    if (!order) {
      return next(new AppError("Order not found or already assigned", 404));
    }

    // Assign lorry to order
    order.lorry = req.user.id;
    await order.save();

    // Mark lorry as unavailable
    lorry.isAvailable = false;
    await lorry.save();

    res.status(200).json({
      success: true,
      message: "Order accepted for delivery",
      data: {
        orderId: order._id,
        pickupOTP: order.pickupOTP,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update lorry location
export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { coordinates } = req.body;

    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      return next(new AppError("Valid coordinates are required", 400));
    }

    // Update lorry location
    const lorry = await Lorry.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          currentLocation: {
            type: "Point",
            coordinates,
          },
        },
      },
      { new: true }
    );

    if (!lorry) {
      return next(new AppError("Lorry not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        location: lorry.currentLocation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lorry = await Lorry.findById(req.user.id)
      .select("-password -__v")
      .lean();

    if (!lorry) {
      return next(new AppError("Lorry not found", 404));
    }

    res.status(200).json({
      success: true,
      data: lorry,
    });
  } catch (error) {
    next(error);
  }
};

// Update lorry profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agencyName, vehicleNumber, currentLocation } = req.body;

    const updateData: any = {};
    if (agencyName) updateData.agencyName = agencyName;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;

    if (currentLocation?.coordinates) {
      updateData.currentLocation = {
        type: "Point",
        coordinates: currentLocation.coordinates,
      };
    }

    const updatedLorry = await Lorry.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -__v");

    res.status(200).json({
      success: true,
      data: updatedLorry,
    });
  } catch (error) {
    next(error);
  }
};

// Get nearby available orders
export const getNearbyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lorry = await Lorry.findById(req.user.id);

    if (!lorry?.currentLocation?.coordinates) {
      return next(new AppError("Lorry location not set", 400));
    }
    console.log(lorry.currentLocation.coordinates);

    const nearbyOrders = await Seller.aggregate([
      // 1. GeoNear as first stage using Seller's location index
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: lorry.currentLocation.coordinates,
          },
          distanceField: "distance",
          maxDistance: 50000,
          spherical: true,
          query: { __t: "Seller" },
          key: "location",
        },
      },
      // 2. Lookup orders for these sellers
      {
        $lookup: {
          from: "orders",
          let: { sellerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$seller", "$$sellerId"] },
                status: "paid",
                lorry: { $exists: false },
              },
            },
          ],
          as: "orders",
        },
      },
      // 3. Unwind and format results
      { $unwind: "$orders" },
      { $replaceRoot: { newRoot: "$orders" } },
      {
        $addFields: {
          distance: "$distance", // Carry distance from seller
        },
      },
      // 4. Final projection
      {
        $project: {
          _id: 1,
          productType: 1,
          quantity: 1,
          pickupLocation: "$location", // Seller's location
          destination: "$buyer.location",
          distance: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: nearbyOrders.length,
      data: nearbyOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lorry = await Lorry.findByIdAndUpdate(
      req.user.id,
      { $set: { isAvailable: true } },
      { new: true }
    ).select("-password -__v");

    if (!lorry) {
      return next(new AppError("Lorry not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Lorry marked as available",
      data: lorry,
    });
  } catch (error) {
    next(error);
  }
};
