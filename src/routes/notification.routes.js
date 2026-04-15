import express from "express";
import { getMyNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";
import { VerifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", VerifyJWT, getMyNotifications);
router.post("/:id/read", VerifyJWT, markAsRead);
router.post("/readAll", VerifyJWT, markAllAsRead);

export default router;
