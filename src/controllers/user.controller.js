import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";


const GetProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id; // User ID from authentication middleware
  
  if (!userId) {
    return next(new apiError(401, "Unauthorized. Please log in."));
  }
  
  const user = await User.findById(userId).select("-password");
  
  if (!user) {
    return next(new apiError(404, "User not found."));
  }
  
  res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully."));
});


const UpdateProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id; // User ID from authentication middleware
  
  if (!userId) {
    return next(new apiError(401, "Unauthorized. Please log in."));
  }

  // Fields that can be updated
  const {
    fullName,
    designation,
    employeeId,
    scopusId,
    vidhwanId,
    googleScholarId,
    orcidId,
    bankAccount,
    ifsc,
    branch,
    email
  } = req.body;


  if (!fullName || !email || !designation) {
    return next(new apiError(400, "Full name, email, and designation are required."));
  }

  // Validate email format
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return next(new apiError(400, "Invalid email format."));
  }

  // Validate bank account (numbers only)
  if (bankAccount && !/^\d+$/.test(bankAccount)) {
    return next(new apiError(400, "Bank account must contain only numbers."));
  }

  // Validate IFSC code format
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return next(new apiError(400, "Invalid IFSC code format."));
  }

  // Check if email is being changed and if it's already in use by another user
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return next(new apiError(400, "Email is already in use by another account."));
    }
  }

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fullName,
        email,
        designation,
        employeeId,
        scopusId,
        vidhwanId,
        googleScholarId,
        orcidId,
        bankAccount,
        ifsc,
        branch
      }
    },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    return next(new apiError(404, "User not found."));
  }

  res.status(200).json(
    new ApiResponse(200, updatedUser, "Profile updated successfully.")
  );
});

export default { GetProfile, UpdateProfile };