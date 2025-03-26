CREATE TABLE "all_user" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"user_id" text,
	"temporary_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporary_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"secure_code" text NOT NULL,
	"secure_code_expires_at" timestamp NOT NULL,
	"role" text NOT NULL,
	"invited_by_all_user_id" text,
	"registration_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
ALTER TABLE "document" RENAME COLUMN "userId" TO "owner_id";--> statement-breakpoint
ALTER TABLE "image" RENAME COLUMN "userId" TO "owner_id";--> statement-breakpoint
ALTER TABLE "note" RENAME COLUMN "userId" TO "owner_id";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "invited_by" TO "invited_by_all_user_id";--> statement-breakpoint
ALTER TABLE "document" DROP CONSTRAINT "document_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "family_member" DROP CONSTRAINT "family_member_owner_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "family_member" DROP CONSTRAINT "family_member_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "family_member" DROP CONSTRAINT "family_member_user_fk";
--> statement-breakpoint
ALTER TABLE "family_relationship" DROP CONSTRAINT "family_relationship_shared_ancestor_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "image" DROP CONSTRAINT "image_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "memory_share" DROP CONSTRAINT "memory_share_owner_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "note" DROP CONSTRAINT "note_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "relationship" DROP CONSTRAINT "relationship_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "relationship" DROP CONSTRAINT "relationship_related_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_invited_by_fk";
--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-25T09:29:40.289Z"}'::json;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "metadata" SET DEFAULT '{"size":0,"mimeType":"","originalName":"","uploadedAt":"2025-03-25T09:29:40.289Z"}'::json;--> statement-breakpoint
ALTER TABLE "all_user" ADD CONSTRAINT "all_users_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."all_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "all_user" ADD CONSTRAINT "all_users_temporary_user_fk" FOREIGN KEY ("temporary_user_id") REFERENCES "public"."temporary_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_user" ADD CONSTRAINT "temporary_user_invited_by_fk" FOREIGN KEY ("invited_by_all_user_id") REFERENCES "public"."all_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_user_type_check" ON "all_user" USING btree ("user_id","temporary_user_id");--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_owner_id_all_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_owner_id_all_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_user_id_all_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."all_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."all_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationship" ADD CONSTRAINT "family_relationship_shared_ancestor_id_all_user_id_fk" FOREIGN KEY ("shared_ancestor_id") REFERENCES "public"."all_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_owner_id_all_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_share" ADD CONSTRAINT "memory_share_owner_id_all_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_share" ADD CONSTRAINT "memory_share_shared_with_id_all_user_id_fk" FOREIGN KEY ("shared_with_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_owner_id_all_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_user_id_all_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_related_user_id_all_user_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."all_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_invited_by_fk" FOREIGN KEY ("invited_by_all_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;