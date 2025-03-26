ALTER TABLE "document" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-25T10:29:10.844Z"}'::json;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-25T10:29:10.844Z"}'::json;--> statement-breakpoint
ALTER TABLE "temporary_user" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "temporary_user" ALTER COLUMN "email" DROP NOT NULL;