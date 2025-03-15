import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

async function generateAT(userId){
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        
        
        return accessToken
    }catch(Err){
        console.log(Err)
        throw new apiError(500 , "Error while generating access token")
    }
} 

const UserLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        throw new apiError(400, "Email and password are required");
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim() }).select("+password");

    if (!user) {
        throw new apiError(400, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(400, "Invalid credentials");
    }

    // Generate access token
    const accessToken = await generateAT(user._id);

        const options = {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 10 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
        };

    // Send response with access token
    res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user }, "Signed In"));
});


const UserRegister = asyncHandler(async(req,res)=>{
    const {fullName, email, password, confirmPassword, department, designation, employeeId, scopusId, vidhwanId, googleScholarId, bankAccount, ifsc, branch, orcidId} = req.body; 


    console.log(req.body)
    console.log(!fullName, !email, !password, !confirmPassword, !department, !designation, !employeeId, !scopusId, !vidhwanId, !googleScholarId, !bankAccount, !ifsc, !branch, !orcidId, )

    if (!fullName ||!email ||!password || !confirmPassword ||!department ||!designation ||!employeeId ||!scopusId ||!vidhwanId || !googleScholarId ||!bankAccount ||!ifsc ||!branch ||!orcidId) {
        throw new apiError(400 , "All fields are required")
    }

    const ExisitingUser = await User.findOne({email : email.trim()})
    if(ExisitingUser){
        throw new apiError(400 , "User already exists")
    }

    const user = await User.create(
        {
            fullName , email , password , department , designation , employeeId , scopusId , vidhwanId, orcidId , bankAccount , ifsc , branch 
        }
    )

    const {accessToken} = await generateAT(user._id);
   
    console.log("new user registered")
    console.log(user)

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 10 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
    };

    res.status(200)
        .cookie("accessToken" , accessToken , options)
        .json(new ApiResponse(200 , {user : user} , "Signed up"))
})

const UserLogout = asyncHandler(async (req, res) => {
    res.status(200)
        .clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: 'None' })
        .json(new ApiResponse(200, "Success", "Logged Out"));
});

const IsLoggedIn = asyncHandler(async (req, res) => {
    const { accessToken } = req.cookies;

    console.log(accessToken)

    if (!accessToken) {
        throw new apiError(401, "Not authenticated");
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        console.log(decoded)

        const user = await User.findById(decoded._id).select("-password");

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



export {UserLogin , UserRegister , UserLogout , IsLoggedIn}