import mongoose, { Schema } from "mongoose";
import User from "../models/user.model";
import { ILorry } from "../types";

const LorrySchema: Schema = new Schema({
  agencyName: {
    type: String,
    required: [true, "Agency name is required"],
    trim: true,
  },
  vehicleNumber: {
    type: String,
    trim: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },

    coordinates: {
      type: [Number],
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

// Create a geospatial index for location-based queries
LorrySchema.index({ currentLocation: "2dsphere" });

const Lorry = User.discriminator<ILorry>("Lorry", LorrySchema);

export default Lorry;
