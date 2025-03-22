import { db } from "@/db/db";
import { documents, images, notes, relationship, users, familyRelationship } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { DBDocument, DBImage, DBNote } from "@/db/schema";
import type { MemoryType } from "@/db/schema";
import FormData from "form-data";
import Mailgun from "mailgun.js";

export type MemoryWithType = {
  type: MemoryType; // Using the existing MemoryType from schema
  data: DBDocument | DBImage | DBNote;
};

export async function findMemory(id: string): Promise<MemoryWithType | null> {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (document) return { type: "document", data: document };

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });
  if (image) return { type: "image", data: image };

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, id),
  });
  if (note) return { type: "note", data: note };

  return null;
}

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "", // your Mailgun API key
});

const DOMAIN = process.env.MAILGUN_DOMAIN || "";
const FROM_EMAIL = process.env.FROM_EMAIL || `hello@${DOMAIN}`;

/**
 * Builds email content based on the memory type.
 * @param memory The memory with type.
 * @param inviterName Name of the person sending the invitation.
 * @param relationship Relationship context.
 * @param includeHtml Whether to include rich HTML content.
 * @returns An object with text (and optionally html) content.
 */
function getEmailContent(
  memory: MemoryWithType,
  inviterName: string,
  relationship: string | undefined,
  includeHtml: boolean
): { text: string; html?: string } {
  const relationshipText = relationship ? `, your ${relationship},` : "";

  if (memory.type === "document") {
    const document = memory.data as {
      title?: string;
      description?: string;
      url: string;
    };
    const textContent = `${inviterName}${relationshipText} has shared a document with you: ${document.title}. Description: ${document.description}. View it here: ${document.url}`;
    const htmlContent = includeHtml
      ? `
    <html>
      <body>
        <h1>Document Shared</h1>
        <p>${inviterName}${relationshipText} has shared a document with you: <strong>${document.title}</strong></p>
        <p>Description: ${document.description}</p>
        <p>View it <a href="${document.url}">here</a>.</p>
      </body>
    </html>
    `
      : undefined;
    return { text: textContent, html: htmlContent };
  } else if (memory.type === "image") {
    // Assume memory.data is an image.
    const image = memory.data as {
      title?: string;
      description?: string;
      caption?: string;
      url: string;
    };
    const textContent = `You've been invited to view an image: ${
      image.title || image.caption || image.url
    }. Invited by: ${inviterName}.`;
    const htmlContent = includeHtml
      ? `
		<html>
		  <body>
			<h1>Image Invitation</h1>
			<p>You have been invited to view an image.</p>
			<p>Title: <strong>${image.title || "No title"}</strong></p>
			<p>Description: ${image.description || "No description"}</p>
			<p>Invited by: ${inviterName}</p>
			<img src="${image.url}" alt="${image.title || "Invited Image"}" style="max-width:600px;" />
		  </body>
		</html>
	  `
      : undefined;
    return { text: textContent, html: htmlContent };
  } else {
    // Fallback for note or other types.
    const textContent = `You've been invited to view a memory. Invited by: ${inviterName}.`;
    const htmlContent = includeHtml
      ? `
		<html>
		  <body>
			<h1>Memory Invitation</h1>
			<p>You've been invited to view a memory.</p>
			<p>Invited by: ${inviterName}</p>
		  </body>
		</html>
	  `
      : undefined;
    return { text: textContent, html: htmlContent };
  }
}

/**
 * Generates the dynamic variables for the template option.
 * @param memory The memory to be shared.
 * @param inviterName The name of the inviter.
 * @returns An object of template variables.
 */
function getTemplateVariables(memory: MemoryWithType, inviterName: string): Record<string, unknown> {
  if (memory.type === "document") {
    const document = memory.data as {
      title?: string;
      description?: string;
      url: string;
    };
    return {
      title: document.title || "Untitled",
      description: document.description || "No description",
      url: document.url,
      inviterName,
    };
  } else if (memory.type === "image") {
    const image = memory.data as {
      title?: string;
      description?: string;
      caption?: string;
      url: string;
    };
    return {
      title: image.title || image.caption || "Image",
      description: image.description || image.caption || "No description",
      url: image.url,
      inviterName,
    };
  } else {
    return { inviterName };
  }
}

/**
 * Sends an invitation email using Mailgun.
 * @param email Recipient email address.
 * @param memory The memory to share.
 * @param invitedById ID of the inviter.
 * @param options Options to control template usage and HTML inclusion.
 * @returns A promise that resolves to true if the email was sent successfully.
 */
export async function sendInvitationEmail(
  email: string,
  memory: MemoryWithType,
  invitedById: string,
  options: { useTemplate?: boolean; useHTML?: boolean } = {}
) {
  try {
    // Retrieve the inviter's name and relationship
    const inviterName = await getInviterName(invitedById);
    const relationship = await getRelationship(invitedById, memory.data.id);

    // TODO: Add registration query parameter to track invitation source

    // TODO: Find correct Mailgun message type or create proper interface
    // We struggle to find the correct type for the message data.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageData: any;

    if (options.useTemplate) {
      // Use Mailgun template
      const templateVars = getTemplateVariables(memory, inviterName || "Someone");
      messageData = {
        from: FROM_EMAIL,
        to: email,
        subject: "You've been invited to view a memory!",
        template: "memory-invitation", // Ensure this template exists in your Mailgun dashboard
        "h:X-Mailgun-Variables": JSON.stringify(templateVars),
        text: "", // You can optionally supply a fallback text version
      };
    } else {
      // Use hardcoded message
      const { text, html } = getEmailContent(memory, inviterName || "Someone", relationship, options.useHTML ?? false);
      messageData = {
        from: FROM_EMAIL,
        to: email,
        subject: "You've been invited to view a memory!",
        text: text,
        ...(options.useHTML && html ? { html } : {}),
      };
    }

    const response = await mg.messages.create(DOMAIN, messageData);
    console.log("Email sent successfully:", response.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(
      `Failed to send invitation email to ${email}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Sends an email about a shared memory to an existing user
 * @param email Recipient email address.
 * @param memory The memory to share.
 * @param sharedById ID of the person who shared the memory.
 * @param shareUrl The URL to view the shared memory.
 * @param options Options to control template usage and HTML inclusion.
 * @returns A promise that resolves to true if the email was sent successfully.
 */
export async function sendSharedMemoryEmail(
  email: string,
  memory: MemoryWithType,
  sharedById: string,
  shareUrl: string,
  options: { useTemplate?: boolean; useHTML?: boolean } = {}
) {
  try {
    const inviterName = await getInviterName(sharedById);
    const relationship = await getRelationship(sharedById, memory.data.id);

    const messageData = {
      from: FROM_EMAIL,
      to: email,
      subject: "A memory has been shared with you on Futura",
      text: `${inviterName}${
        relationship ? `, your ${relationship}` : ""
      } shared a memory with you on Futura. View it here: ${shareUrl}`,
      html: options.useHTML
        ? `
        <html>
          <body>
            <h1>Memory Shared</h1>
            <p>${inviterName}${relationship ? `, your ${relationship}` : ""} shared a memory with you.</p>
            <p><a href="${shareUrl}">Click here to view it</a></p>
          </body>
        </html>
      `
        : undefined,
    };

    const response = await mg.messages.create(DOMAIN, messageData);
    console.log("Email sent successfully:", response.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(
      `Failed to send shared memory email to ${email}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function getInviterName(invitedById: string) {
  const inviter = await db.query.users.findFirst({
    where: eq(users.id, invitedById),
  });
  return inviter?.name;
}

async function getRelationship(inviterId: string, invitedId: string) {
  const rel = await db.query.relationship.findFirst({
    where: () => and(eq(relationship.userId, inviterId), eq(relationship.relatedUserId, invitedId)),
  });

  if (rel?.type === "family") {
    const familyRel = await db.query.familyRelationship.findFirst({
      where: eq(familyRelationship.relationshipId, rel.id),
    });
    return familyRel?.familyRole;
  }

  return rel?.type;
}

/*
Database Query Explanation (Drizzle ORM):

1. db.query:
   - This is Drizzle ORM's query builder
   - Provides type-safe way to query the database
   - Example: db.query.relationship means we're querying the 'relationship' table

2. findFirst():
   - Returns the first matching record or null
   - Similar to SQL's "SELECT * FROM table LIMIT 1"
   - Useful when we expect only one match or just need any match

3. where():
   - Specifies conditions for the query
   - Similar to SQL's WHERE clause
   - Takes a function that returns the conditions

4. eq():
   - Drizzle's equality operator
   - Creates a condition checking if column equals value
   - Example: eq(relationship.userId, inviterId) is like "WHERE user_id = inviterId"

5. and():
   - Combines multiple conditions with AND
   - Example: and(condition1, condition2) is like "WHERE condition1 AND condition2"

6. rel variable:
   - Used to access the relationship type (rel.type)
   - Also provides the relationship ID (rel.id) needed for family relationship lookup
   - Could be null, hence the optional chaining (?.)

Example SQL equivalent:
-- First query (relationship)
SELECT FROM relationship
WHERE userId = inviterId AND relatedUserId = invitedId

-- Second query (familyRelationship)
SELECT FROM familyRelationship
WHERE relationshipId = relationship.id

-- Third query (combined)
SELECT 
  relationship.type,
  relationship.id,
  familyRelationship.familyRole
FROM 
  relationship
LEFT JOIN familyRelationship ON relationship.id = familyRelationship.relationshipId
WHERE 
  relationship.userId = inviterId AND relationship.relatedUserId = invitedId
*/
