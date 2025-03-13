import express from "express";
import { createClaim, myClaims, getClaimById } from "../controllers/claim.controller.js";
import { VerifyJWT } from "../middleware/authMiddleware.js";
// import upload from "../utils/multer.js";  // Import Multer setup
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/claim", VerifyJWT, upload.fields([
    { name: "paperFront", maxCount: 1 },
    { name: "claimProof", maxCount: 1 }
]), createClaim);

router.get("/myClaims", VerifyJWT, myClaims);
router.get("/claim/:id", VerifyJWT, getClaimById);

export default router;
