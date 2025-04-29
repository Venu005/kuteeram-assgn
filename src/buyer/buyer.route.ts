import { Router } from "express";
import {
  getProfile,
  updateProfile,
  searchProducts,
  createBid,
  processPayment,
  confirmDelivery,
  getOrders,
  getNearbyRiceMills,
  getOrderSummary,
} from "../buyer/buyer.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { bidValidation } from "../middleware/validation.middleware";

const router = Router();

// Protect all routes - require authentication and buyer role
router.use(protect);
router.use(authorize("buyer"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/search", searchProducts);
router.post("/bid", bidValidation, createBid);
router.post("/payment", processPayment);
router.post("/confirm-delivery", confirmDelivery);
router.get("/orders", getOrders);
router.get("/get-nearby-mills", getNearbyRiceMills);
router.get("/orders/:orderId", getOrderSummary);
export default router;
