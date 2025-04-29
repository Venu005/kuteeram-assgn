import mongoose from "mongoose";
import config from "./config";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB connected successfully");
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
