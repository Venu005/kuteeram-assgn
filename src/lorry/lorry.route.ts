import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getNearbyOrders,
  acceptOrder,
  updateLocation,
  markAsAvailable,
} from "./lorry.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);
router.use(authorize("lorry"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/nearby-orders", getNearbyOrders);
router.post("/accept-order", acceptOrder);
router.put("/location", updateLocation);
router.put("/available", markAsAvailable);

export default router;
