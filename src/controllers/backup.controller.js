import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Notification from "../models/notification.model.js";
import Admin from "../models/admin.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
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

// Minimal Base32 Decoder for TOTP secrets
const base32Decode = (base32) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = Buffer.alloc(Math.floor((base32.length * 5) / 8));

    for (let i = 0; i < base32.length; i++) {
        const val = alphabet.indexOf(base32[i].toUpperCase());
        if (val === -1) continue;
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            output[index++] = (value >> (bits - 8)) & 0xFF;
            bits -= 8;
        }
    }
    return output;
};

// Pure Node.js TOTP Verification (RFC 6238)
const verifyTOTP = (token, secret) => {
    try {
        const key = base32Decode(secret);
        // Step period is 30 seconds
        const counter = Math.floor(Date.now() / 1000 / 30);
        
        // We check current window and one window before/after to allow for minor time drift
        for (let i = -1; i <= 1; i++) {
            const checkCounter = BigInt(counter + i);
            const buf = Buffer.alloc(8);
            buf.writeBigInt64BE(checkCounter, 0);

            const hmac = crypto.createHmac("sha1", key).update(buf).digest();
            const offset = hmac[hmac.length - 1] & 0xf;
            const code = ((hmac[offset] & 0x7f) << 24 |
                         (hmac[offset + 1] & 0xff) << 16 |
                         (hmac[offset + 2] & 0xff) << 8 |
                         (hmac[offset + 3] & 0xff)) % 1000000;

            if (code.toString().padStart(6, '0') === token) {
                return true;
            }
        }
        return false;
    } catch (err) {
        console.error("TOTP Verification Error:", err);
        return false;
    }
};

// Emergency login using Google Authenticator (TOTP)
const emergencyLogin = asyncHandler(async (req, res) => {
    const { pin } = req.body; // In TOTP mode, 'pin' is the 6-digit code
    const TOTP_SECRET = process.env.EMERGENCY_TOTP_SECRET;

    if (!TOTP_SECRET) {
        throw new apiError(500, "Emergency TOTP Secret is not configured on the server.");
    }

    if (!verifyTOTP(pin, TOTP_SECRET)) {
        throw new apiError(401, "Invalid Authenticator Code.");
    }

    // Generate a short-lived "Degraded" token
    const token = jwt.sign(
        { id: "emergency", role: "admin", isDegraded: true },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 1 * 60 * 60 * 1000 // 1 hour
    };

    res.status(200)
        .cookie("adminToken", token, options)
        .json(new ApiResponse(200, { token }, "Emergency access granted."));
});

export { generateBackup, listServerBackups, downloadServerBackup, emergencyLogin };
