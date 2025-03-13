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

export default { GetProfile };
