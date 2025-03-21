import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/admin.model.js";
import Claim from "../models/claim.model.js"; // Assuming claims are stored in a Claim model
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import dotenv from "dotenv";
import User from "../models/user.model.js"
import mongoose from "mongoose";
// import User from "../models/user.model.js";

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
    expiresIn: "3d",
  });



  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 10 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
  };



  res.status(200)
    .cookie("adminToken" , token , options)
    .json(new ApiResponse(200, { token }, "Admin logged in successfully."));
});

// Check if Admin is Logged In
const adminLoggedIn = asyncHandler(async (req, res, next) => {
    const { adminToken } = req.cookies;

    console.log("admin token " + adminToken)

    if (!adminToken) {
        throw new apiError(401, "Not authenticated");
    }

    try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);

        console.log(decoded)

        const user = await Admin.findById(decoded.id).select("-password");

        if (!user) {
            throw new apiError(401, "User not found");
        }

        const token = jwt.sign({ id: user._id, role: "admin" }, process.env.JWT_SECRET, {
          expiresIn: "10d",
        });

        const options = {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 10 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
        };


        res.status(200)
          .cookie("adminToken" , token , options)  
          .json(new ApiResponse(200, { user }, "User is logged in"));
    } catch (err) {
        console.log(err)
        throw new apiError(401, "Invalid or expired token");
    }
});


const adminLogout = asyncHandler(async (req, res, next) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json(new ApiResponse(200, {}, "Admin logged out successfully."));
});

const adminRegister = asyncHandler(async(req,res,next)=>{
    const {email, password} = req.body; 


    // console.log(req.body)
    // console.log(!fullName, !email, !password, !confirmPassword, !department, !designation, !employeeId, !scopusId, !vidhwanId, !googleScholarId, !bankAccount, !ifsc, !branch, !orcidId, )

    if (!email ||!password ) {
        throw new apiError(400 , "All fields are required")
    }

    const ExisitingUser = await Admin.findOne({email : email.trim()})
    if(ExisitingUser){
        throw new apiError(400 , "Admin already exists")
    }

    const user = await Admin.create(
        {
            email , password 
        }
    )

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
   
    console.log("new user registered")
    console.log(user)

    const options = {
        httpOnly : true ,
        secure : true,
        sameSite: 'None'
    }

    res.status(200)
        .cookie("adminToken" , token , options)
        .json(new ApiResponse(200 , user , "Signed up"))
})

// Get All Claims (Admin Only)
const getAllClaims = asyncHandler(async (req, res, next) => {
  const claims = await Claim.find()
    .populate("user", "fullName email department"); // Added department to the populated fields

  res.status(200).json(new ApiResponse(200, claims, "All claims retrieved successfully."));
});


const adminGetUsers = asyncHandler(async(req,res,next)=>{
  const users = await User.find().populate("claims")

  res.status(200).json(new ApiResponse(200 ,users , "got all users" ))
})

const getUserClaims = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  
  // Validate userId format (assuming MongoDB ObjectId)
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid user ID format.")
    );
  }

  try {
    // Find all claims for the specified user
    const claims = await Claim.find({ user: userId })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 }); // Sort by newest first
    
    // Check if any claims were found
    if (!claims || claims.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, { claims: [] }, "No claims found for this user.")
      );
    }
    
    res.status(200).json(
      new ApiResponse(200, { claims }, "User claims retrieved successfully.")
    );
  } catch (error) {
    console.error("Error fetching user claims:", error);
    return next(new ApiError(500, "Failed to fetch user claims"));
  }
});


const getDeptClaims = asyncHandler(async(req, res, next) => { 
  const { department } = req.body;
  
  const departmentUsers = await User.find({ department: department });
  
  if (!departmentUsers.length) {
    return res.status(404).json(new ApiResponse(404, null, "No users found with the specified department."));
  }
  
  const userIds = departmentUsers.map(user => user._id);
  
  const claims = await Claim.find({ user: { $in: userIds } })
                           .populate("user", "fullName email department");
 
  res.status(200).json(new ApiResponse(200, claims, "All department claims retrieved successfully.")); 
});


const getCustomClaims = asyncHandler(async (req, res, next) => {
  const { department, status } = req.body;

  const filters = {};

  if (department && department !== 'ALL') {
    const departmentUsers = await User.find({ department });

    if (!departmentUsers.length) {
      return res.status(404).json(new ApiResponse(404, null, "No users found with the specified department."));
    }

    const userIds = departmentUsers.map(user => user._id);
    filters.user = { $in: userIds };
  }

  if (status && status !== 'ALL') {
    filters.status = status;
  }

  const claims = await Claim.find(filters).populate("user", "fullName email department");

  res.status(200).json(new ApiResponse(200, claims, "Filtered claims retrieved successfully."));
});


const updateStatus = asyncHandler(async(req,res,next)=>{
  const {_id} = req.body ;

  await Claim.findByIdAndUpdate(_id , {status : "Processed"})
  res.status(200).json(new ApiResponse(200 , "Updated" , "Updated Status Successfully"))
})


const deleteClaim = asyncHandler(async(req, res, next) => {
  const { _id } = req.body;
  
  // First find the claim to get the user ID
  const claim = await Claim.findById(_id);
  
  if (!claim) {
    return res.status(404).json(new ApiResponse(404, null, "Claim not found."));
  }
  
  // Delete the claim
  const deleteResult = await Claim.deleteOne({ _id: _id });
  
  if (deleteResult.deletedCount === 0) {
    return res.status(500).json(new ApiResponse(500, null, "Failed to delete claim."));
  }
  
  // Remove claim reference from the user's claims array
  await User.updateOne(
    { _id: claim.user },
    { $pull: { claims: _id } }
  );
  
  res.status(200).json(new ApiResponse(200, deleteResult, "Claim deleted successfully."));
});

export { adminLogin, adminLoggedIn, getAllClaims , adminLogout , adminRegister , adminGetUsers , getUserClaims , getDeptClaims , deleteClaim , updateStatus , getCustomClaims };
