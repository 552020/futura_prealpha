import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);

const API_KEY = process.env.MAILGUN_API_KEY || "";
const DOMAIN = process.env.MAILGUN_DOMAIN || ""; // "futura.now"
const FROM_EMAIL = process.env.MAILGUN_FROM || `hello@${DOMAIN}`;

if (!API_KEY || !DOMAIN) {
  throw new Error("Missing Mailgun API credentials");
}

const mg = mailgun.client({
  username: "api",
  key: API_KEY,
  url: "https://api.eu.mailgun.net", // Use "api.mailgun.net" if your region is US
});

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
  }>;
};

export const sendEmail = async ({ to, subject, text, html, replyTo, attachments }: EmailOptions) => {
  try {
    const messageData: Record<string, any> = {
      from: FROM_EMAIL,
      to,
      subject,
    };

    // Add optional fields if provided
    if (text) messageData.text = text;
    if (html) messageData.html = html;
    if (replyTo) messageData["h:Reply-To"] = replyTo;
    if (attachments && attachments.length > 0) {
      messageData.attachment = attachments;
    }

    const response = await mg.messages.create(DOMAIN, messageData);

    console.log(`Email sent to ${to} with subject: ${subject}`);
    return response;
  } catch (error) {
    console.error("Mailgun Error:", error);
    throw error;
  }
};
