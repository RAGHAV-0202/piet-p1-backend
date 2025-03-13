import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import asyncHandler from "./utils/asyncHandler.js"
import mongoose from "mongoose"
import ApiResponse from "./utils/apiResponse.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import claimRoutes from "./routes/claim.routes.js";
import adminRoutes from "./routes/admin.routes.js"


dotenv.config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(cookieParser())

const corsOptions = {
    origin: ['*', 'http://localhost:3000' , "http://172.20.10.2:3000" , "http://192.168.29.76:3000" , "http://localhost:5173"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true ,
    sameSite: 'None'
};

app.use(cors(corsOptions))


async function getStats(){
  const startTime = Date.now();
  const result = await mongoose.connection.db.command({ ping: 1 });
  const endTime = Date.now();
  const latency = endTime - startTime;

  const isMongoConnected = mongoose.connection.readyState === 1;
  const statusInfo = {
    status: "OK",
    mongoDB: isMongoConnected ? "Connected" : "Disconnected",
    latency: latency + "ms",
    timestamp: new Date(),
  };
  return statusInfo
}


app.get(/\/.*\/status$/, asyncHandler(async (req, res) => {
  const statusInfo = await getStats()
  res.status(200).json(statusInfo);
}));


app.get("/" , async(req,res)=>{
  const statusInfo = await getStats()
  res.status(200).json(new ApiResponse(200 , statusInfo , "Server is live"))
})



app.use("/api/auth" , authRouter)
app.use("/api/form", claimRoutes);
app.use("/api/profile", userRouter);
app.use("/api/admin", adminRoutes);



app.get("*" , (req,res)=>{
    res.status(404).send(`
        <body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; min-width: 100vw; box-sizing : border-box">
            <h1>Resource not found <br> Status Code 404</h1>
        </body>
    `)
})

export {app}