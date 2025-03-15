import express from "express";
import { adminLogin, adminLoggedIn, getAllClaims , adminLogout , adminRegister , adminGetUsers} from "../controllers/admin.controller.js";
// import { adminAuth } from "../middlewares/adminAuth.js"; // Middleware for admin authentication
import { adminAuth } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/loggedin", adminAuth, adminLoggedIn);
router.get("/claims", adminAuth, getAllClaims);
router.get("/users" , adminAuth , adminGetUsers)
router.post("/logout", adminLogout);
router.post("/register" , adminRegister) ;

export default router;
