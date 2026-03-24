-- This migration was manually authored (production readiness fix).
-- Make it idempotent because the previous deploy attempt failed after partially applying statements.

-- 1) bids.rejection_reason
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bids'
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE "bids" ADD COLUMN "rejection_reason" TEXT;
  END IF;
END $$;

-- 2) rfqs.awarded_bid_id (must match bids.id which is TEXT in existing DB)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfqs'
      AND column_name = 'awarded_bid_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "rfqs"
      ALTER COLUMN "awarded_bid_id" TYPE TEXT
      USING "awarded_bid_id"::text;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfqs'
      AND column_name = 'awarded_bid_id'
  ) THEN
    ALTER TABLE "rfqs" ADD COLUMN "awarded_bid_id" TEXT;
  END IF;
END $$;

-- 3) unique index (nullable, so multiple NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS "rfqs_awarded_bid_id_key"
ON "rfqs"("awarded_bid_id");

-- 4) FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rfqs_awarded_bid_id_fkey'
  ) THEN
    ALTER TABLE "rfqs"
      ADD CONSTRAINT "rfqs_awarded_bid_id_fkey"
      FOREIGN KEY ("awarded_bid_id") REFERENCES "bids"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 5) purchase_orders.rfq_id (must match rfqs.id which is TEXT in existing DB)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'purchase_orders'
      AND column_name = 'rfq_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "purchase_orders"
      ALTER COLUMN "rfq_id" TYPE TEXT
      USING "rfq_id"::text;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'purchase_orders'
      AND column_name = 'rfq_id'
  ) THEN
    ALTER TABLE "purchase_orders" ADD COLUMN "rfq_id" TEXT;
  END IF;
END $$;

-- 6) new nullable columns on purchase_orders
ALTER TABLE "purchase_orders"
  ADD COLUMN IF NOT EXISTS "payment_terms" "PaymentTerm";

ALTER TABLE "purchase_orders"
  ADD COLUMN IF NOT EXISTS "delivery_date_required" TIMESTAMP(3);

-- 7) FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_rfq_id_fkey'
  ) THEN
    ALTER TABLE "purchase_orders"
      ADD CONSTRAINT "purchase_orders_rfq_id_fkey"
      FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
