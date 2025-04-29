import { Router } from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getProductById,
  markProductAvailable,
} from "../controllers/product.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { productValidation } from "../middleware/validation.middleware";

const router = Router();

router.use(protect);

// Seller routes
router.post("/", authorize("seller"), ...productValidation, addProduct);
router.put("/:productId", authorize("seller"), updateProduct);
router.delete("/:productId", authorize("seller"), deleteProduct);
router.get("/seller", authorize("seller"), getSellerProducts);
router.put("/:productId/available", authorize("seller"), markProductAvailable);

// Common routes
router.get("/:productId", getProductById);

export default router;
