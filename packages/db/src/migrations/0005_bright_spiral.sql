CREATE TYPE "public"."learning_status" AS ENUM('backlog', 'active', 'completed', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('article', 'video', 'book', 'course', 'podcast', 'note');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('idea', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "learning_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"learning_track_id" uuid,
	"topic_id" uuid,
	"title" varchar(400) NOT NULL,
	"material_type" "material_type" DEFAULT 'article' NOT NULL,
	"url" text,
	"status" "learning_status" DEFAULT 'active' NOT NULL,
	"estimate_minutes" integer,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"learning_track_id" uuid,
	"material_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_track_id" uuid NOT NULL,
	"parent_topic_id" uuid,
	"name" varchar(300) NOT NULL,
	"description" text,
	"status" "learning_status" DEFAULT 'active' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(300) NOT NULL,
	"description" text,
	"status" "learning_status" DEFAULT 'active' NOT NULL,
	"goal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(160),
	"last_name" varchar(160),
	"display_name" varchar(300) NOT NULL,
	"company" varchar(300),
	"role_title" varchar(300),
	"primary_email" varchar(320),
	"primary_phone" varchar(80),
	"short_profile" text,
	"notes_markdown" text,
	"last_interaction_at" timestamp with time zone,
	"source_type" "source_type" DEFAULT 'manual',
	"external_provider_id" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(400) NOT NULL,
	"description" text,
	"target_date" timestamp with time zone,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(300),
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(300) NOT NULL,
	"slug" varchar(320) NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"purpose" text,
	"current_next_action" text,
	"current_milestone" text,
	"repo_url" text,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_learning_track_id_learning_tracks_id_fk" FOREIGN KEY ("learning_track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_topic_id_learning_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_learning_track_id_learning_tracks_id_fk" FOREIGN KEY ("learning_track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_material_id_learning_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."learning_materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_topics" ADD CONSTRAINT "learning_topics_learning_track_id_learning_tracks_id_fk" FOREIGN KEY ("learning_track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_tracks" ADD CONSTRAINT "learning_tracks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_tracks" ADD CONSTRAINT "learning_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_learning_materials_ws_user_status" ON "learning_materials" USING btree ("workspace_id","user_id","status");--> statement-breakpoint
CREATE INDEX "idx_learning_sessions_ws_user_started" ON "learning_sessions" USING btree ("workspace_id","user_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_learning_topics_track_order" ON "learning_topics" USING btree ("learning_track_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_learning_tracks_ws_user_status" ON "learning_tracks" USING btree ("workspace_id","user_id","status");--> statement-breakpoint
CREATE INDEX "idx_contacts_ws_user_display_name" ON "contacts" USING btree ("workspace_id","user_id","display_name");--> statement-breakpoint
CREATE INDEX "idx_contacts_ws_user_last_interaction" ON "contacts" USING btree ("workspace_id","user_id","last_interaction_at");--> statement-breakpoint
CREATE INDEX "idx_project_milestones_project_order" ON "project_milestones" USING btree ("project_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_project_notes_project_created" ON "project_notes" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_projects_ws_user_status" ON "projects" USING btree ("workspace_id","user_id","status");--> statement-breakpoint
CREATE INDEX "idx_projects_ws_user_slug" ON "projects" USING btree ("workspace_id","user_id","slug");