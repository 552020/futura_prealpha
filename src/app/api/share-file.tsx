import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db/db";
import { files } from "@/db/schema";
// import { files, photos, texts } from "@/db/schema";
export default async function shareFile(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { fileId, ownerId } = req.body;
    // const { fileId, ownerId, sharedWithEmail, permissionLevel } = req.body;

    try {
      // Determine the resource type based on the fileId or other logic
      // const resourceType = "file"; // Adjust this logic as needed

      await db.insert(files).values({
        userId: ownerId as string,
        url: `some-url/${fileId}`,
        filename: `file-${fileId}`,
        mimeType: "application/pdf",
        size: "123456", // Convert the number to a string
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
