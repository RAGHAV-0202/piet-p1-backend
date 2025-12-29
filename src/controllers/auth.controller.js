import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
import {sendMail} from "../utils/sendMail.js"
import { accountCreationEmail } from "../utils/accountCreationEmail.js";

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
        .json(new ApiResponse(200, { accessToken : accessToken }, "Signed In"));
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

    if (password !== confirmPassword) {
        throw new apiError(400, "Passwords do not match");
    }


    const user = await User.create({
        fullName,
        email,
        password,
        department,
        designation,
        employeeId,
        scopusId,
        vidhwanId,
        googleScholarId, 
        orcidId,
        bankAccount,
        ifsc,
        branch
    });


    const {accessToken} = await generateAT(user._id);
   
    console.log("new user registered")
    console.log(user)

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
    };

    const htmlContent = accountCreationEmail({
        fullName,
        email,
        employeeId,
        department,
        designation,
        bankAccount,
        ifsc
    });

    res.status(200)
    .cookie("accessToken" , accessToken , options)
    .json(new ApiResponse(200 , {user : user} , "Signed up"))

    try {
        await sendMail(
            email,
            "Account Created Successfully",
            htmlContent
        );
    } catch (error) {
        console.error("Email sending failed:", error.message);
    }
})

const UserLogout = asyncHandler(async (req, res) => {
    res.status(200)
        .clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: 'None' })
        .json(new ApiResponse(200, "Success", "Logged Out"));
});

const IsLoggedIn = asyncHandler(async (req, res) => {
        const authHeader = req.headers.authorization;

    const accessToken =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.cookies?.accessToken;

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

const UserPasswordResetRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new apiError(400, "Enter email");
    }

    const user = await User.findOne({ email });

    // Prevent email enumeration
    if (!user) {
        return res.status(200).json(
            new ApiResponse(200, null, "If the email exists, a reset link has been sent")
        );
    }

    const token = jwt.sign(
        { _id: user._id },
        process.env.RESET_PASSWORD_SECRET,
        { expiresIn: "10m" }
    );

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    const link = `${process.env.BASE_URL}/${token}`;
    console.log("Reset Link:", link);

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #007bff;">Password Reset Request</h1>
            <p style="font-size: 16px; color: #333;">
                We received a request to reset your password.
                Click the button below to reset your password.
            </p>

            <a href="${link}"
            style="display: inline-block;
                    background-color: #007bff;
                    color: #ffffff;
                    padding: 15px 25px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: 20px;">
                Reset Password
            </a>

            <p style="font-size: 14px; color: #555; margin-top: 20px;">
                If you did not request this password reset, please ignore this email.
            </p>

            <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
                Don't share this link with anyone else.
                This link will expire in 15 minutes.
            </p>
        </div>
    </div>
    `;

    await sendMail(email, htmlContent);

    res.status(200).json(
        new ApiResponse(200, null, "If the email exists, a reset link has been sent")
    );
});


const UserPasswordResetPage = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
        throw new apiError(400, "No token provided");
    }

    if (!password) {
        throw new apiError(400, "Enter password");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    } catch (err) {
        throw new apiError(400, "Reset link expired or invalid");
    }

    const user = await User.findById(decoded._id);

    if (!user) {
        throw new apiError(400, "Invalid token");
    }

    if (user.resetToken !== token) {
        throw new apiError(400, "Reset link already used or invalid");
    }

    user.password = password; // relies on pre-save bcrypt hook
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json(
        new ApiResponse(200, null, "Password updated successfully")
    );
});



export {UserLogin , UserRegister , UserLogout , IsLoggedIn , UserPasswordResetRequest  , UserPasswordResetPage}