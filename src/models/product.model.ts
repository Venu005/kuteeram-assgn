import mongoose, { Schema } from "mongoose";
import { IProduct } from "../types";

const ProductSchema: Schema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },
    productType: {
      type: String,
      required: [true, "Product type is required"],
      trim: true,
      index: "text",
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
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
