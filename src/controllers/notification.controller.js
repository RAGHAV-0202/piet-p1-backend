import Notification from "../models/notification.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

// Get all notifications for the logged-in user
export const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount = await Notification.countDocuments({ 
        user: req.user._id, 
        isRead: false 
    });

    res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, "Notifications retrieved."));
});

// Mark a single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new apiError(404, "Notification not found.");
    }

    res.status(200).json(new ApiResponse(200, notification, "Notification marked as read."));
});

// Mark all notifications as read for the logged-in user
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read."));
});
