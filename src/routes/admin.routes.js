import express from "express";
import { adminLogin, adminLoggedIn, getAllClaims , adminLogout , adminRegister , adminGetUsers , getUserClaims , getDeptClaims , deleteClaim , updateStatus , getCustomClaims , getDepartmentStats} from "../controllers/admin.controller.js";
import { generateBackup, listServerBackups, downloadServerBackup, emergencyLogin } from "../controllers/backup.controller.js";
// import { adminAuth } from "../middlewares/adminAuth.js"; // Middleware for admin authentication
import { adminAuth } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/loggedin", adminAuth, adminLoggedIn);
router.get("/claims", adminAuth, getAllClaims);
router.get("/deptClaims" , adminAuth , getDeptClaims)
router.post("/delete" , adminAuth , deleteClaim)
router.post("/update" , adminAuth , updateStatus)
router.get("/users" , adminAuth , adminGetUsers)
router.get("/customClaims" , adminAuth , getCustomClaims)
router.get("/backup", adminAuth, generateBackup);
router.get("/server-backups", adminAuth, listServerBackups);
router.get("/server-backups/:filename", adminAuth, downloadServerBackup);

router.post("/logout", adminLogout);
router.post("/register" , adminRegister) ;
router.get('/users/:userId/claims', adminAuth ,getUserClaims);
router.get('/departmentStats', adminAuth, getDepartmentStats);
router.post("/emergency-login", emergencyLogin);

export default router;
