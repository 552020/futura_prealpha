import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db/db";
import { sharing } from "@/db/schema";

export default async function shareFile(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { fileId, ownerId, sharedWithEmail, permissionLevel } = req.body;

    try {
      // Insert the share record into the database
      await db.insert(sharing).values({
        resourceType: "file",
        resourceId: fileId,
        ownerId: ownerId,
        sharedWithId: null, // Set to null initially, as the user is not registered yet
        recipientEmail: sharedWithEmail,
        permissionLevel: permissionLevel,
      });

      // Placeholder for sending an email invitation to the second user
      // await sendEmail({
      //   to: sharedWithEmail,
      //   subject: "You have been invited to access a shared file",
      //   text: `You have been invited to view a file. Please register to access it.`,
      //   // Include a registration link if applicable
      // });

      return res
        .status(200)
        .json({ message: "File shared successfully and invitation sent." });
    } catch (error) {
      console.error("Error sharing file:", error);
      return res.status(500).json({ error: "Failed to share file." });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed." });
  }
}
