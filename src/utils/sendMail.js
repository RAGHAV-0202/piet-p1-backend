import dotenv from "dotenv"
dotenv.config()
import {google} from "googleapis"

const {
    EMAIL_CLIENT_ID,
    EMAIL_CLIENT_SECRET,
    EMAIL_REFRESH_TOKEN,
    EMAIL_SENDER,
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
    EMAIL_CLIENT_ID,
    EMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({ refresh_token: EMAIL_REFRESH_TOKEN });

// Add the missing sendMail function
const sendMail = async (to, subject, htmlContent) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        
        const emailLines = [
            `To: ${to}`,
            `From: ${EMAIL_SENDER}`,
            `Subject: ${subject}`,
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlContent
        ];
        
        const email = emailLines.join('\r\n');
        const base64Email = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
        
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: base64Email
            }
        });
        
        console.log('Email sent successfully:', result.data);
        return result.data;
        
    } catch (error) {
        console.error('Error sending email:', error);
        throw new apiError(500, "Failed to send email");
    }
};

export {sendMail}