import mongoose, { Schema } from "mongoose";
import { IOrder } from "../types";

const OrderSchema: Schema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "Buyer",
      required: [true, "Buyer is required"],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    bid: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      required: [true, "Bid is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.1, "Quantity must be greater than 0"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },
    commission: {
      type: Number,
      required: [true, "Commission is required"],
      min: [0, "Commission cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [1, "Total amount must be greater than 0"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    lorry: {
      type: Schema.Types.ObjectId,
      ref: "Lorry",
    },
    pickupOTP: {
      type: String,
    },
    pickupOTPExpires: {
      type: Date,
    },
    isPicked: {
      type: Boolean,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
