import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/admin.model.js";
import Claim from "../models/claim.model.js"; // Assuming claims are stored in a Claim model
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import dotenv from "dotenv";
import User from "../models/user.model.js"
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

const adminGetUsers = asyncHandler(async(req,res,next)=>{
  const users = await User.find()

  res.status(200).json(new ApiResponse(200 ,users , "got all users" ))
})


export { adminLogin, adminLoggedIn, getAllClaims , adminLogout , adminRegister , adminGetUsers};
