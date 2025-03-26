ALTER TABLE "document" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-26T12:24:05.741Z"}'::json;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-26T12:24:05.740Z"}'::json;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "owner_secure_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "image" ADD COLUMN "owner_secure_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_share" ADD COLUMN "invitee_secure_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_share" ADD COLUMN "secure_code_created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "owner_secure_code" text NOT NULL;