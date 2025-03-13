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
    if (!req.files || !req.files["paperFront"] || !req.files["claimProof"]) {
        throw new apiError(400, "Missing required parameter - file");
    }

    // Extract file buffers
    const paperFrontBuffer = req.files["paperFront"][0].buffer;
    const claimProofBuffer = req.files["claimProof"][0].buffer;

    // Upload both files in parallel
    const [paperFrontUrl, claimProofUrl] = await Promise.all([
        uploadToCloudinary(paperFrontBuffer, "claims"),
        uploadToCloudinary(claimProofBuffer, "claims"),
    ]);

    // Create claim in DB
    const claim = await Claim.create({
        user: req.user._id,
        title: req.body.title,
        numberOfAuthors: req.body.numberOfAuthors,
        authors: Array.isArray(req.body.authors) ? req.body.authors : JSON.parse(req.body.authors),
        publicationDate: req.body.publicationDate,
        webLink: req.body.webLink,
        venue: req.body.venue,
        calculatedAmount: req.body.calculatedAmount,
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
