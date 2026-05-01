ALTER TABLE "exercises" ADD COLUMN "primary_muscle_groups_json" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "secondary_muscle_groups_json" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "movement_pattern" varchar(120);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "instructions_json" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "common_mistakes_json" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "video_json" jsonb;--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD COLUMN "target_reps_min" integer;--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD COLUMN "target_reps_max" integer;--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD COLUMN "target_weight_value" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD COLUMN "target_weight_unit" varchar(16);--> statement-breakpoint
ALTER TABLE "workout_plan_exercises" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD COLUMN "slug" varchar(220);--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_workout_plans_ws_user_slug" ON "workout_plans" USING btree ("workspace_id","user_id","slug");