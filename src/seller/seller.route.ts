import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getDashboard,
  verifyPickupOTP,
} from "./seller.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);
router.use(authorize("seller"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/dashboard", getDashboard);
router.post("/verify-pickup", verifyPickupOTP);
router.get;
export default router;
