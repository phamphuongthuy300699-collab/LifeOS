ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "source_provider" varchar(30) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_calendar_id" varchar(255);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_event_id" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "timezone" varchar(100);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "meeting_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "metadata_json" jsonb;--> statement-breakpoint
DO $$ BEGIN
 CREATE UNIQUE INDEX "uidx_events_ws_provider_external_event"
   ON "events" ("workspace_id", "source_provider", "external_event_id")
   WHERE "external_event_id" IS NOT NULL;
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
