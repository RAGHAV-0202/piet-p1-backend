import express from "express"
import {UserLogin , UserRegister , UserLogout , IsLoggedIn} from "../controllers/auth.controller.js"

const Router = express.Router()

Router.route("/login").post(UserLogin)
Router.route("/register").post(UserRegister)
Router.route("/logout").post(UserLogout)
Router.route("/loggedin").get(IsLoggedIn)

export default Router