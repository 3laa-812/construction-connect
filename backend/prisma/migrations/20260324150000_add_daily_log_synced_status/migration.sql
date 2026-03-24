-- Section 4: add SYNCED status for daily logs.
-- Keep this migration idempotent across slightly drifted/dev databases.

-- 1) Ensure enum type exists with baseline values when missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'DailyLogStatus'
  ) THEN
    CREATE TYPE "DailyLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SYNCED');
  END IF;
END $$;

-- 2) Ensure SYNCED enum value exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'DailyLogStatus' AND e.enumlabel = 'SYNCED'
  ) THEN
    ALTER TYPE "DailyLogStatus" ADD VALUE 'SYNCED';
  END IF;
END $$;

-- 3) If daily_logs.status exists and is not this enum, align it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_logs' AND column_name = 'status'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_logs'
      AND column_name = 'status'
      AND udt_name <> 'DailyLogStatus'
  ) THEN
    ALTER TABLE "daily_logs"
      ALTER COLUMN "status" TYPE "DailyLogStatus"
      USING CASE
        WHEN status::text = 'DRAFT' THEN 'DRAFT'::"DailyLogStatus"
        WHEN status::text = 'SUBMITTED' THEN 'SUBMITTED'::"DailyLogStatus"
        ELSE 'SUBMITTED'::"DailyLogStatus"
      END;
  END IF;
END $$;
