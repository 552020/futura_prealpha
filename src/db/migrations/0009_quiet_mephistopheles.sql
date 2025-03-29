ALTER TABLE "document" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-28T11:43:57.011Z"}'::json;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-28T11:43:57.010Z"}'::json;--> statement-breakpoint
ALTER TABLE "memory_share" ALTER COLUMN "shared_with_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_share" ADD COLUMN "group_id" text;--> statement-breakpoint
ALTER TABLE "memory_share" ADD COLUMN "shared_relationship_type" text;--> statement-breakpoint
ALTER TABLE "memory_share" ADD CONSTRAINT "memory_share_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;