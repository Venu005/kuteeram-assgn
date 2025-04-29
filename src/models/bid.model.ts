import mongoose, { Schema } from "mongoose";
import { IBid } from "../types";

const BidSchema: Schema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "Buyer",
      required: [true, "Buyer is required"],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    bidPrice: {
      type: Number,
      required: [true, "Bid price is required"],
      min: [1, "Bid price must be greater than 0"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Bid = mongoose.model<IBid>("Bid", BidSchema);

export default Bid;
