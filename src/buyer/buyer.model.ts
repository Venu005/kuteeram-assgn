import mongoose, { Schema } from "mongoose";
import User from "../models/user.model";
import { IBuyer } from "../types";

const BuyerSchema: Schema = new Schema({
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
    },
  },
});

// Create a geospatial index for location-based queries

BuyerSchema.index({ buyerLocation: "2dsphere" });

const Buyer = User.discriminator<IBuyer>("Buyer", BuyerSchema);

export default Buyer;
