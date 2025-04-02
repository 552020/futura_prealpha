CREATE TABLE "video" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration" integer,
	"mime_type" text NOT NULL,
	"size" text NOT NULL,
	"owner_secure_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-04-01T14:09:00.756Z"}'::json;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-04-01T14:09:00.755Z"}'::json;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_owner_id_all_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;