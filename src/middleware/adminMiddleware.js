import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/admin.model.js";

const adminAuth = asyncHandler(async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
  const token = req.cookies.adminToken || req.header("Authorization")?.replace("Bearer " , "")

  if (!token) {
    return next(new apiError(401, "Access denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
