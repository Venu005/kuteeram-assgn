import { Router } from "express";
import {
  registerSeller,
  registerBuyer,
  registerLorry,
  login,
} from "../controllers/auth.controller";
import {
  sellerRegisterValidation,
  buyerRegisterValidation,
  lorryRegisterValidation,
  loginValidation,
} from "../middleware/validation.middleware";

const router = Router();

router.post("/register/seller", sellerRegisterValidation, registerSeller);
router.post("/register/buyer", buyerRegisterValidation, registerBuyer);
router.post("/register/lorry", lorryRegisterValidation, registerLorry);
router.post("/login", loginValidation, login);

export default router;
