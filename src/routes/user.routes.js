import express from "express"
// import {UserLogin , UserRegister , UserLogout} from "../controllers/auth.controller.js"
import { VerifyJWT } from "../middleware/authMiddleware.js";
import userController from "../controllers/user.controller.js";
const Router = express.Router()

Router.get("/profile", VerifyJWT, userController.GetProfile);



export default Router;