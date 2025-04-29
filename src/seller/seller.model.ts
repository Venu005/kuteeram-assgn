import mongoose, { Schema } from "mongoose";
import User from "../models/user.model";
import { ISeller } from "../types";

const SellerSchema: Schema = new Schema({
  millName: {
    type: String,
    required: [true, "Mill name is required"],
    trim: true,
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  district: {
    type: String,
    required: [true, "District is required"],
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: [true, "Coordinates are required"],
    },
  },
  address: {
    type: String,
    trim: true,
  },
});

SellerSchema.index({ location: "2dsphere" });

const Seller = User.discriminator<ISeller>("Seller", SellerSchema);

export default Seller;
