ALTER TABLE "all_user" DROP CONSTRAINT "all_users_user_fk";
--> statement-breakpoint
ALTER TABLE "all_user" DROP CONSTRAINT "all_users_temporary_user_fk";
--> statement-breakpoint
DROP INDEX "one_user_type_check";--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-25T14:08:24.911Z"}'::json;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-25T14:08:24.911Z"}'::json;