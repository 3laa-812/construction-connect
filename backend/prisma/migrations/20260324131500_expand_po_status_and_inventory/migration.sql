-- Section 3: expand PO status lifecycle and add Inventory table.

-- 1) Add enum values if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'POStatus' AND e.enumlabel = 'OUT_FOR_DELIVERY'
  ) THEN
    ALTER TYPE "POStatus" ADD VALUE 'OUT_FOR_DELIVERY';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'POStatus' AND e.enumlabel = 'DELIVERED'
  ) THEN
    ALTER TYPE "POStatus" ADD VALUE 'DELIVERED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'POStatus' AND e.enumlabel = 'CANCELLED'
  ) THEN
    ALTER TYPE "POStatus" ADD VALUE 'CANCELLED';
  END IF;
END $$;

-- 2) Inventory table (TEXT ids to match current schema style).
CREATE TABLE IF NOT EXISTS "inventories" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "qty_on_hand" DECIMAL(14,3) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inventories_project_id_product_name_unit_key"
ON "inventories"("project_id", "product_name", "unit");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventories_project_id_fkey'
  ) THEN
    ALTER TABLE "inventories"
      ADD CONSTRAINT "inventories_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
