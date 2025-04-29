import { Request, Response, NextFunction } from "express";

import Product from "../models/product.model";
import Bid from "../models/bid.model";
import Order from "../models/order.model";
import config from "../config/config";
import { ISeller } from "../types";
import Lorry from "../lorry/lorry.model";
import mongoose from "mongoose";
import { AppError } from "../middleware/error.middleware";
import Seller from "../seller/seller.model";
import { io } from "../server";
import { generateOTP } from "../utils/location.utils";
import Buyer from "./buyer.model";
// Search for products
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productType, quantity } = req.query;
    const buyer = await Buyer.findById(req.user.id);

    if (!buyer) return next(new AppError("Buyer not found", 404));

    // Build base query
    const query: any = { isAvailable: true };

    // Add search condition
    if (productType) {
      query.$text = { $search: productType.toString() };
    }

    // Quantity filter
    if (quantity) query.quantity = { $gte: Number(quantity) };

    // Find products with sorting by text score
    const products = await Product.find(query)
      .populate("seller", "district city location")
      .sort({ score: { $meta: "textScore" } });

    // Format results
    const formattedProducts = products.map((product, index) => {
      const seller = product.seller as any;
      const priceWithCommission = product.price * (1 + config.commissionRate);

      return {
        id: product._id,
        productType: product.productType,
        quantity: product.quantity,
        basePrice: product.price,
        priceWithCommission: parseFloat(priceWithCommission.toFixed(2)),
        sellerId: seller._id,
        anonymizedSeller: `${seller.district} Rice Mill #${index + 1}`,
        district: seller.district,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// Create a bid

export const createBid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, bidPrice } = req.body;

    // Find product with seller info
    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (!product.isAvailable) {
      return next(new AppError("Product is not available", 400));
    }

    // Create bid
    const bid = await Bid.create({
      buyer: req.user.id,
      product: productId,
      bidPrice,
    });

    // Get seller room name
    const seller = product.seller as ISeller;
    const sellerRoom = `seller_${seller._id}`;

    if (bidPrice >= product.price) {
      // Auto-accept the bid
      bid.status = "accepted";
      await bid.save();

      // Create order
      const commission = bidPrice * config.commissionRate;
      const totalAmount = bidPrice + commission;

      const order = await Order.create({
        buyer: req.user.id,
        seller: product.seller,
        product: productId,
        bid: bid._id,
        quantity: product.quantity,
        price: bidPrice,
        commission,
        totalAmount,
        status: "pending",
        pickupOTP: generateOTP(),
        pickupOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      // Update product availability
      product.isAvailable = false;
      await product.save();

      // Notify seller
      io.to(sellerRoom).emit("bidAccepted", {
        productId: product._id,
        productType: product.productType,
        bidId: bid._id,
        orderId: order._id,
        amount: totalAmount,
        buyerId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Bid accepted automatically",
        data: {
          bid,
          order: {
            id: order._id,
            status: order.status,
            totalAmount,
          },
        },
      });
      return;
    }

    io.to(sellerRoom).emit("newBid", {
      productId: product._id,
      productType: product.productType,
      bidId: bid._id,
      bidPrice,
      askingPrice: product.price,
      buyerId: req.user.id,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Bid created ",
      data: bid,
    });
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user.id,
      status: "pending",
    });

    if (!order) {
      return next(new AppError("Order not found or already paid", 404));
    }
    order.status = "paid";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: {
        orderId: order._id,
        status: order.status,
        amount: order.totalAmount,
        paymentMethod,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Confirm delivery
export const confirmDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.body;

    // 1. Find order without status filters
    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user.id,
    });

    // 2. Handle order not found
    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // 3. Check delivery status
    if (order.isDelivered) {
      return next(new AppError("Delivery already confirmed previously", 409));
    }

    // 4. Validate order state
    if (order.status !== "shipped" || !order.isPicked) {
      return next(
        new AppError("Order not ready for delivery confirmation", 409)
      );
    }

    // 5. Update and save order
    order.isDelivered = true;
    order.status = "delivered";
    await order.save();

    // 6. Update lorry availability
    if (order.lorry) {
      await Lorry.findByIdAndUpdate(
        order.lorry,
        { $set: { isAvailable: true } },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Delivery confirmed successfully",
      data: {
        orderId: order._id,
        status: order.status,
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
    const buyer = await Buyer.findById(req.user.id)
      .select("-password -__v")
      .populate("location")
      .lean();

    if (!buyer) {
      return next(new AppError("Buyer not found", 404));
    }

    res.status(200).json({
      success: true,
      data: buyer,
    });
  } catch (error) {
    next(error);
  }
};

// Update buyer profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, email, location } = req.body;
    const buyer = await Buyer.findById(req.user.id);

    if (!buyer) {
      return next(new AppError("Buyer not found", 404));
    }

    // Update fields
    if (name) buyer.name = name;
    if (phone) buyer.phone = phone;
    if (email) buyer.email = email;

    if (location?.coordinates) {
      buyer.location = {
        type: "Point",
        coordinates: location.coordinates,
      };
    }

    const updatedBuyer = await buyer.save();

    res.status(200).json({
      success: true,
      data: {
        id: updatedBuyer._id,
        name: updatedBuyer.name,
        phone: updatedBuyer.phone,
        email: updatedBuyer.email,
        location: updatedBuyer.location,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get buyer's orders
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate({
        path: "seller",
        select: "district city",
        model: "Seller",
      })
      .populate("product", "productType quantity price")
      .populate("lorry", "agencyName vehicleNumber")
      .sort("-createdAt")
      .lean();

    const formattedOrders = orders.map((order) => {
      const seller = order.seller as any;
      return {
        ...order,
        seller: {
          displayName: `${seller.district} Rice Mill #${seller._id
            .toString()
            .slice(-4)}`,
          city: seller.city,
        },
        product: order.product,
        lorry: order.lorry,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyRiceMills = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const buyer = await Buyer.findById(req.user.id);

    if (!buyer?.location?.coordinates) {
      return next(new AppError("Buyer location not set", 400));
    }

    const nearbyMills = await Seller.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: buyer.location.coordinates,
          },
          distanceField: "distance",
          maxDistance: 500000, // 50km
          spherical: true,
          query: { __t: "Seller" },
          key: "location", // Use seller's index
        },
      },
      {
        $project: {
          _id: 1,
          millName: 1,
          city: 1,
          distance: 1,
          location: 1,
          address: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: nearbyMills.length,
      data: nearbyMills,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError("Invalid order ID", 400));
    }

    const orders = await Order.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId),
          buyer: new mongoose.Types.ObjectId(req.user.id),
          status: "delivered",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
          pipeline: [
            {
              $project: {
                district: 1,
                city: 1,
                millName: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$seller" },
      {
        $project: {
          _id: 1,
          productType: 1,
          quantity: 1,
          totalAmount: 1,
          status: 1,
          deliveryDate: "$updatedAt",
          seller: {
            name: {
              $concat: ["$seller.district", " Rice Mill"],
            },
            district: "$seller.district",
            city: "$seller.city",
          },
          payment: {
            method: "$paymentMethod",
            status: {
              $cond: { if: "$isPaid", then: "completed", else: "pending" },
            },
          },
        },
      },
    ]);

    if (orders.length === 0) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      success: true,
      data: orders[0],
    });
  } catch (error) {
    next(error);
  }
};
