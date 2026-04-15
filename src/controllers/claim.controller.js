import Claim from "../models/claim.model.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import cloudinary from "../utils/cloudinary.js"; 

// Helper function to upload file to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "raw", format: "pdf" },
            (error, result) => {
                if (error) reject(new apiError(500, "Cloudinary upload failed."));
                else resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
};

// Create a new claim with Cloudinary file upload
export const createClaim = asyncHandler(async (req, res) => {
    // Duplicate claim detection - check before uploading files to save bandwidth
    if (req.body.title && req.body.webLink && req.body.webLink !== "NA") {
        const existingClaim = await Claim.findOne({
            user: req.user._id,
            title: req.body.title.trim(),
            webLink: req.body.webLink.trim()
        });
        if (existingClaim) {
            throw new apiError(409, "You have already submitted a claim with the same title and web link.");
        }
    }

    // Fix the logical condition - using && instead of || for the category check
    if ((req.body.category !== "Professional Body Membership" && req.body.category !== "Conference") && 
        (!req.files || !req.files["paperFront"] || !req.files["claimProof"])) {
        throw new apiError(400, "Missing required parameter - file");
    }

    // For Conference category, check if claimProof is required but missing
    if (req.body.category === "Conference" && (!req.files || !req.files["claimProof"])) {
        throw new apiError(400, "Conference submission requires proof of claim");
    }

    var paperFrontUrl = "";
    var claimProofUrl = "";

    if (req.body.category === "Professional Body Membership") {
        paperFrontUrl = "NA";
        claimProofUrl = "NA";
    } else if (req.body.category === "Conference") {
        // For Conference, we only need claimProof
        const claimProofBuffer = req.files["claimProof"][0].buffer;
        claimProofUrl = await uploadToCloudinary(claimProofBuffer, "claims");
        paperFrontUrl = "NA"; // No paper front for conference
    } else {
        // For all other categories, we need both files
        const paperFrontBuffer = req.files["paperFront"][0].buffer;
        const claimProofBuffer = req.files["claimProof"][0].buffer;

        [paperFrontUrl, claimProofUrl] = await Promise.all([
            uploadToCloudinary(paperFrontBuffer, "claims"),
            uploadToCloudinary(claimProofBuffer, "claims"),
        ]);
    }

    console.log(req.user._id);

    console.log({
        user: req.user._id,
        title: req.body.title,
        numberOfAuthors: req.body.numberOfAuthors,
        authors: Array.isArray(req.body.authors) ? req.body.authors : JSON.parse(req.body.authors),
        publicationDate: req.body.publicationDate,
        webLink: req.body.webLink,
        venue: req.body.venue,
        category: req.body.category,
        calculatedAmount: req.body.calculatedAmount,
        totalAmount: req.body.totalAmount,
        paperFront: paperFrontUrl,
        claimProof: claimProofUrl,
    });

    // Create claim in DB
    const claim = await Claim.create({
        user: req.user._id,
        title: req.body.title,
        numberOfAuthors: req.body.numberOfAuthors,
        authors: Array.isArray(req.body.authors) ? req.body.authors : JSON.parse(req.body.authors),
        publicationDate: req.body.publicationDate,
        webLink: req.body.webLink,
        venue: req.body.venue,
        category: req.body.category,
        calculatedAmount: req.body.calculatedAmount,
        totalAmount: req.body.totalAmount,
        paperFront: paperFrontUrl,
        claimProof: claimProofUrl,
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { claims: claim._id } });

    res.status(201).json(new ApiResponse(201, claim, "Claim created successfully."));
});

// Get claims of logged-in user
export const myClaims = asyncHandler(async (req, res) => {
    const claims = await Claim.find({ user: req.user._id });
    res.status(200).json(new ApiResponse(200, claims, "My claims retrieved."));
});

// Get specific claim by ID
export const getClaimById = asyncHandler(async (req, res) => {
    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new apiError(404, "Claim not found.");
    res.status(200).json(new ApiResponse(200, claim, "Claim retrieved."));
});


export const deleteClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(new apiError(400, "Invalid claim ID"));
  }

  const claim = await Claim.findById(id);
  if (!claim) {
    return res.status(404).json(new apiError(404, "No claim found"));
  }

  const createdAt = new Date(claim.createdAt);
  const now = new Date();
  const diffInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  if (diffInDays > 7) {
    return res
      .status(403)
      .json(new apiError(403, "Claim can only be deleted within 7 days of creation"));
  }

  await Claim.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, {}, "Claim deleted successfully"));
});
