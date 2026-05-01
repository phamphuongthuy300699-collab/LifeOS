CREATE TYPE "public"."estimation_mode" AS ENUM('manual', 'ai_parsed', 'barcode', 'favorite');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout');--> statement-breakpoint
CREATE TABLE "daily_nutrition_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"summary_date" date NOT NULL,
	"calories_consumed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"protein_consumed_g" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fat_consumed_g" numeric(10, 2) DEFAULT '0' NOT NULL,
	"carbs_consumed_g" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(300) NOT NULL,
	"brand" varchar(250),
	"calories_per_100g" numeric(8, 2),
	"protein_per_100g" numeric(8, 2),
	"fat_per_100g" numeric(8, 2),
	"carbs_per_100g" numeric(8, 2),
	"source_type" "source_type" DEFAULT 'manual' NOT NULL,
	"is_custom" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"food_item_id" uuid,
	"raw_name" varchar(300) NOT NULL,
	"grams" numeric(8, 2),
	"portion_count" numeric(8, 2),
	"calories" numeric(8, 2),
	"protein_g" numeric(8, 2),
	"fat_g" numeric(8, 2),
	"carbs_g" numeric(8, 2),
	"estimation_mode" "estimation_mode" DEFAULT 'manual' NOT NULL,
	"confidence" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_type" "source_type" DEFAULT 'manual' NOT NULL,
	"source_ref_type" varchar(50),
	"source_ref_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"calories_target" integer,
	"protein_target_g" numeric(8, 2),
	"fat_target_g" numeric(8, 2),
	"carbs_target_g" numeric(8, 2),
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_nutrition_summaries" ADD CONSTRAINT "daily_nutrition_summaries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_nutrition_summaries" ADD CONSTRAINT "daily_nutrition_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_daily_nutrition_summary_ws_user_date" ON "daily_nutrition_summaries" USING btree ("workspace_id","user_id","summary_date");--> statement-breakpoint
CREATE INDEX "idx_food_items_ws_user_name" ON "food_items" USING btree ("workspace_id","user_id","name");--> statement-breakpoint
CREATE INDEX "idx_meal_entries_meal" ON "meal_entries" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "idx_meals_ws_user_consumed_at" ON "meals" USING btree ("workspace_id","user_id","consumed_at");--> statement-breakpoint
CREATE INDEX "idx_nutrition_goals_ws_user_effective" ON "nutrition_goals" USING btree ("workspace_id","user_id","effective_from");