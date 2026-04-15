import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/admin.model.js";
import mongoose from "mongoose";

const adminAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies.adminToken || req.header("Authorization")?.replace("Bearer " , "")

  if (!token) {
    return next(new apiError(401, "Access denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      // Degraded mode: Allow if JWT is valid even if DB is down
      req.user = { id: decoded.id, role: "admin", isDegraded: true };
      return next();
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return next(new apiError(403, "Unauthorized access."));
    }

    req.user = admin;
    next();
  } catch (error) {
    return next(new apiError(401, "Invalid or expired token."));
  }
});

export { adminAuth };
