import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/admin.model.js";
import Claim from "../models/claim.model.js"; // Assuming claims are stored in a Claim model
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import dotenv from "dotenv";

dotenv.config();

// Admin Login
const adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log(req.cookie)

  const admin = await Admin.findOne({ email });

  if (!admin || admin.password !== password) {
    return next(new apiError(401, "Invalid email or password."));
  }

  // Generate JWT token
  const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });



    const options = {
      httpOnly : true ,
      secure : true,
      sameSite: 'None'
    }


  res.status(200)
    .cookie("adminToken" , token , options)
    .json(new ApiResponse(200, { token }, "Admin logged in successfully."));
});

// Check if Admin is Logged In
const adminLoggedIn = asyncHandler(async (req, res, next) => {
      const { adminToken } = req.cookies;

    console.log(adminToken)

    if (!adminToken) {
        throw new apiError(401, "Not authenticated");
    }

    try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);

        console.log(decoded)

        const user = await Admin.findById(decoded._id).select("-password");

        console.log(user)

        if (!user) {
            throw new apiError(401, "User not found");
        }

        res.status(200).json(new ApiResponse(200, { user }, "User is logged in"));
    } catch (err) {
        console.log(err)
        throw new apiError(401, "Invalid or expired token");
    }
});

// Get All Claims (Admin Only)
const getAllClaims = asyncHandler(async (req, res, next) => {
  const claims = await Claim.find().populate("user", "name"); // Fetch user details

  res.status(200).json(new ApiResponse(200, claims, "All claims retrieved successfully."));
});


const adminLogout = asyncHandler(async (req, res, next) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json(new ApiResponse(200, {}, "Admin logged out successfully."));
});



export { adminLogin, adminLoggedIn, getAllClaims , adminLogout};
