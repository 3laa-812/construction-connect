-- AlterTable
ALTER TABLE "daily_logs" ADD COLUMN     "log_title" VARCHAR(500),
ADD COLUMN     "progress_notes" JSONB;
