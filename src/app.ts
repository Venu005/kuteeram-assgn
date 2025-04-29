import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.route";
import sellerRoutes from "./seller/seller.route";
import buyerRoutes from "./buyer/buyer.route";
import productRoutes from "./routes/product.route";
import lorryRoutes from "./lorry/lorry.route";
import cookieParser from "cookie-parser";

const app: Express = express();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/lorry", lorryRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use(errorHandler);

export default app;
