import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Notification from "../models/notification.model.js";
import Admin from "../models/admin.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import mongoose from "mongoose";

const BACKUP_DIR = path.resolve("./backups");

// Ensure the backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const generateBackup = asyncHandler(async (req, res) => {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;
    if (!isMongoConnected) {
        throw new apiError(503, "Cannot generate live backup while MongoDB is disconnected.");
    }

    // Fetch all data from the primary collections
    const users = await User.find({});
    const claims = await Claim.find({});
    const notifications = await Notification.find({});
    const admins = await Admin.find({}).select("-password"); // Safe export

    // Construct the backup object
    const backupData = {
        meta: {
            backupDate: new Date(),
            version: "1.1",
            application: "Piet-P1",
            type: "full_snapshot"
        },
        data: {
            users,
            claims,
            notifications,
            admins
        }
    };

    // Prepare the file name
    const date = new Date().toISOString().replace(/:/g, '-');
    const fileName = `piet_backup_${date}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // 1. Save to server disk
    await fs.promises.writeFile(filePath, JSON.stringify(backupData, null, 2));

    // 2. Set headers for immediate file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Send the JSON as a response
    res.status(200).send(JSON.stringify(backupData, null, 2));
});

// List all backups stored on the server
const listServerBackups = asyncHandler(async (req, res) => {
    try {
        const files = await fs.promises.readdir(BACKUP_DIR);
        
        const backupFiles = await Promise.all(files
            .filter(file => file.endsWith('.json'))
            .map(async (file) => {
                const stats = await fs.promises.stat(path.join(BACKUP_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            }));

        // Sort by newest first
        backupFiles.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json(new ApiResponse(200, backupFiles, "Server backups retrieved successfully."));
    } catch (err) {
        throw new apiError(500, "Failed to list server backups.");
    }
});

// Download a specific file from the server
const downloadServerBackup = asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    // Security: Ensure path is within backup directory
    if (!filePath.startsWith(BACKUP_DIR)) {
        throw new apiError(403, "Invalid file path.");
    }

    if (!fs.existsSync(filePath)) {
        throw new apiError(404, "Backup file not found.");
    }

    res.download(filePath);
});

export { generateBackup, listServerBackups, downloadServerBackup };
