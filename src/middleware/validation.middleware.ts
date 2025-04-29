import { Request, Response, NextFunction } from "express";
import { body, ValidationChain, validationResult } from "express-validator";
import { RequestHandler } from "express";

import { AppError } from "./error.middleware";

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    next(new AppError(message, 400)); // Use error handling middleware
    return; // Important: return after calling next()
  }
  next();
};

export const sellerRegisterValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("millName").notEmpty().withMessage("Mill name is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("location.coordinates")
    .isArray()
    .withMessage("Location coordinates must be an array")
    .custom((value) => {
      if (!value || value.length !== 2) {
        throw new Error(
          "Location coordinates must contain longitude and latitude"
        );
      }
      return true;
    }),
  validate,
];

export const buyerRegisterValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validate,
];

export const lorryRegisterValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("agencyName").notEmpty().withMessage("Agency name is required"),
  body("currentLocation.coordinates")
    .optional()
    .isArray()
    .withMessage("Location coordinates must be an array")
    .custom((value) => {
      if (value.length !== 2) {
        throw new Error(
          "Location coordinates must contain longitude and latitude"
        );
      }
      return true;
    }),
  validate,
];

export const loginValidation = [
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// Fix validate middleware signature

// Update productValidation typing
export const productValidation: (RequestHandler | ValidationChain)[] = [
  body("productType").notEmpty().withMessage("Product type is required"),
  body("quantity")
    .isNumeric()
    .withMessage("Quantity must be a number")
    .custom((value) => value > 0)
    .withMessage("Quantity must be greater than 0"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((value) => value > 0)
    .withMessage("Price must be greater than 0"),
  validate,
];
export const bidValidation = [
  body("bidPrice")
    .isNumeric()
    .withMessage("Bid price must be a number")
    .custom((value) => {
      if (value <= 0) {
        throw new Error("Bid price must be greater than 0");
      }
      return true;
    }),
  validate,
];
