import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
import {sendMail} from "../utils/sendMail.js"

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

    if (!email || !password) {
        throw new apiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.trim() }).select("+password");

    if (!user) {
        throw new apiError(400, "Invalid credentials");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(400, "Invalid credentials");
    }
    const accessToken = await generateAT(user._id);

        const options = {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
        };

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
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
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

const UserPasswordResetRequest = asyncHandler(async(req,res)=>{
    const {email} = req.body;
    
    if(!email){
        throw new apiError(400 , "enter email");
    }
    
    const user = User.findOne({email})

    if(!user){
        throw new apiError(400 , "User not found / invalid email id");
    }

    const token = jwt.sign(
        {_id : user._id} ,
        process.env.RESET_PASSWORD_SECRET , 
        {expiresIn : process.env.RESET_PASSWORD_SECRET}
    )

    user.resetToken = token 
    await user.save();

    const link = `${process.env.BASE_URL}/${token}`;
    console.log("Reset Link:", link);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #007bff;">Password Reset Request</h1>
                <p style="font-size: 16px; color: #333;">We received a request to reset your password. Click the button below to reset your password.</p>
                <a href="${link}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; margin-top: 20px;">Reset Password</a>
                <p style="font-size: 14px; color: #555; margin-top: 20px;">If you did not request this password reset, please ignore this email.</p>
                <p style="font-size: 12px; color: #aaa; margin-top: 20px;">Don't share this link with anyone else. This link will expire in 15 minutes.</p>
            </div>
        </div>
    `;

    await sendMail(email, "Reset Your Password", htmlContent);

    res.status(200).json(new ApiResponse(200, null, "Reset link sent successfully"));

})

const UserPasswordResetPage = asyncHandler(asyncHandler(async(req,res)=>{
    const token = req.params 
    if(!token){
        throw new apiError(400 , "no token present , Unauthorized access")
    }

    const {password} = req.body
    if(!password){
        throw new apiError(400 , "Enter Password");
    }

    const decoded = jwt.verify(token , process.env.RESET_PASSWORD_SECRET)
    if(!decoded){
        throw new apiError(400 , "Invalid token or token expired")
    }

    const user = await User.findById(decoded._id).select("-password -refreshToken")
    if(!user){
        throw new apiError(400 , "invalid token or token expired")
    }
    if(user.resetToken !== token) {
        throw new apiError(400 , "Reset Link has been used !!!")
    }

    user.password = password
    user.resetToken = ""
    await user.save();
    res.status(200).json(new ApiResponse(200 , "Password Updated"))

}))


export {UserLogin , UserRegister , UserLogout , IsLoggedIn , UserPasswordResetRequest  , UserPasswordResetPage}
