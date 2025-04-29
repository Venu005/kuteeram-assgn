import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/error.middleware";
import Seller from "../seller/seller.model";
import Buyer from "../buyer/buyer.model";
import { generateToken } from "../utils/jwt.utils";
import config from "../config/config";
import User from "../models/user.model";
import Lorry from "../lorry/lorry.model";

export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      phone,
      password,
      millName,
      city,
      district,
      location,
      address,
    } = req.body;

    // Check if user with phone already exists
    const existingUser = await Seller.findOne({ phone });
    if (existingUser) {
      return next(
        new AppError("User with this phone number already exists", 400)
      );
    }

    // Create new seller
    const seller = await Seller.create({
      name,
      phone,
      password,
      role: "seller",
      millName,
      city,
      district,
      location: {
        type: "Point",
        coordinates: location.coordinates,
      },
      address,
    });

    // Generate token
    const token = generateToken(seller);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: seller._id,
        name: seller.name,
        phone: seller.phone,
        role: seller.role,
        millName: seller.millName,
        city: seller.city,
        district: seller.district,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerBuyer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, password, location } = req.body;

    // Check if user with phone already exists
    const existingUser = await Buyer.findOne({ phone });
    if (existingUser) {
      return next(
        new AppError("User with this phone number already exists", 400)
      );
    }

    // Create buyer object with optional location
    const buyerData: any = {
      name,
      phone,
      password,
      role: "buyer",
    };

    // Add location if provided
    if (location && location.coordinates) {
      buyerData.location = {
        type: "Point",
        coordinates: location.coordinates,
      };
    }

    // Create new buyer
    const buyer = await Buyer.create(buyerData);

    // Generate token
    const token = generateToken(buyer);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: buyer._id,
        name: buyer.name,
        phone: buyer.phone,
        role: buyer.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerLorry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      phone,
      password,
      agencyName,
      vehicleNumber,
      currentLocation,
    } = req.body;

    // Check if user with phone already exists
    const existingUser = await Lorry.findOne({ phone });
    if (existingUser) {
      return next(
        new AppError("User with this phone number already exists", 400)
      );
    }

    // Create new lorry
    const lorry = await Lorry.create({
      name,
      phone,
      password,
      role: "lorry",
      agencyName,
      vehicleNumber,
      currentLocation: currentLocation?.coordinates
        ? {
            type: "Point",
            coordinates: [17.4346, 78.3792],
          }
        : undefined,
    });

    // Generate token
    const token = generateToken(lorry);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: lorry._id,
        name: lorry.name,
        phone: lorry.phone,
        role: lorry.role,
        agencyName: lorry.agencyName,
        vehicleNumber: lorry.vehicleNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid credentials", 401));
    }

    const token = generateToken(user);

    res
      .cookie(config.cookieSettings.name, token, config.cookieSettings)
      .status(200)
      .json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res
    .clearCookie(config.cookieSettings.name)
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
