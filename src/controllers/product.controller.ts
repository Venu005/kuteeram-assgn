import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/error.middleware";
import Product from "../models/product.model";
import { ISeller } from "../types";

// Add product
export const addProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productType, quantity, price, isAvailable = true } = req.body;

    // Create product
    const product = await Product.create({
      seller: req.user.id,
      productType,
      quantity,
      price,
      isAvailable,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { productType, quantity, price, isAvailable } = req.body;

    // Find product
    let product = await Product.findOne({
      _id: productId,
      seller: req.user.id,
    });

    if (!product) {
      return next(
        new AppError("Product not found or not owned by seller", 404)
      );
    }

    // Update product
    const updateData: any = {};
    if (productType !== undefined) updateData.productType = productType;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Mark product as available
export const markProductAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    // Find product
    let product = await Product.findOne({
      _id: productId,
      seller: req.user.id,
    });

    if (!product) {
      return next(
        new AppError("Product not found or not owned by seller", 404)
      );
    }

    // Update product
    product.isAvailable = true;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    // Find and delete product
    const product = await Product.findOneAndDelete({
      _id: productId,
      seller: req.user.id,
    });

    if (!product) {
      return next(
        new AppError("Product not found or not owned by seller", 404)
      );
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// Get seller's products
export const getSellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all products for the logged-in seller
    const products = await Product.find({ seller: req.user.id })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    // Find product with seller details
    const product = await Product.findById(productId).populate({
      path: "seller",
      select: "millName district city",
      model: "Seller",
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    //* Anonymize seller information
    const seller = product.seller as ISeller;
    const productWithAnonymizedSeller = {
      ...product.toObject(),
      seller: {
        id: seller._id,
        displayName: `${seller.district} Rice Mill #${seller
          ._id!.toString()
          .slice(-4)}`,
        city: seller.city,
      },
    };

    res.status(200).json({
      success: true,
      data: productWithAnonymizedSeller,
    });
  } catch (error) {
    next(error);
  }
};
