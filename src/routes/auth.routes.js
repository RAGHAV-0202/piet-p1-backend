import express from "express"
import {UserLogin , UserRegister , UserLogout , IsLoggedIn , UserPasswordResetRequest  , UserPasswordResetPage} from "../controllers/auth.controller.js"

const Router = express.Router()

Router.route("/login").post(UserLogin)
Router.route("/register").post(UserRegister)
Router.route("/logout").post(UserLogout)
Router.route("/loggedin").get(IsLoggedIn)
Router.route("/reset").post(UserPasswordResetRequest)
Router.route("/reset/:token").post(UserPasswordResetPage)


export default Router