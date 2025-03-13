import jwt from "jsonwebtoken"
import express from "express"
import asyncHandler from "../utils/asyncHandler.js"
import User from "../models/user.model.js"
import apiError from "../utils/apiError.js"
import dotenv from "dotenv"
dotenv.config()

export const VerifyJWT = asyncHandler(async(req,res,next)=>{
    const accessToken = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer " , "")

    if(!accessToken){
        throw new apiError(403 , "No accessToken present , Unauthorized access")
    }

    const decodedToken = jwt.verify(accessToken , process.env.ACCESS_TOKEN_SECRET)
    // console.log(decodedToken)

    if(!decodedToken){
         throw new apiError(403 , "Invalid accessToken present , Unauthorized access")
    }

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    if(!user){
        throw new apiError(403 , "Invalid accessToken present , Unauthorized access")
    }

    req.user = user
    next()
})
