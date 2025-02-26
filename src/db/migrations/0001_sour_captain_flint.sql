CREATE TABLE "sharing" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"shared_with_id" text NOT NULL,
	"recipient_email" text,
	"permission_level" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
ALTER TABLE "sharing" ADD CONSTRAINT "sharing_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharing" ADD CONSTRAINT "sharing_shared_with_id_user_id_fk" FOREIGN KEY ("shared_with_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;