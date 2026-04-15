import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Notification from "../models/notification.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const generateBackup = asyncHandler(async (req, res) => {
    // Fetch all data from the primary collections
    const users = await User.find({});
    const claims = await Claim.find({});
    const notifications = await Notification.find({});

    // Construct the backup object
    const backupData = {
        meta: {
            backupDate: new Date(),
            version: "1.0",
            application: "Piet-P1"
        },
        data: {
            users,
            claims,
            notifications
        }
    };

    // Prepare the file name
    const date = new Date().toISOString().split('T')[0];
    const fileName = `piet_p1_backup_${date}.json`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Send the JSON as a response
    res.status(200).send(JSON.stringify(backupData, null, 2));
});

export { generateBackup };
