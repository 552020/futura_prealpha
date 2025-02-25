import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db/db";
import { texts } from "@/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Received request:", req.method, req.body);

  if (req.method === "POST") {
    const { userId, title, content } = req.body;

    try {
      await db.insert(texts).values({
        userId,
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return res.status(200).json({ message: "Text saved successfully!" });
    } catch (error) {
      console.error("Error saving text:", error);
      return res.status(500).json({ error: "Failed to save text." });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed." });
  }
}
