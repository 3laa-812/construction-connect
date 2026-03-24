-- AlterEnum (append new variant; safe to re-run only via migrate history)
ALTER TYPE "InvoiceStatus" ADD VALUE 'ISSUED';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN "country" VARCHAR(2) DEFAULT 'SA';

ALTER TABLE "invoices" ADD COLUMN "vat_rate" DECIMAL(6, 4),
ADD COLUMN "currency" VARCHAR(3) DEFAULT 'SAR',
ADD COLUMN "due_date" TIMESTAMP(3),
ADD COLUMN "pdf_storage_key" VARCHAR(512),
ADD COLUMN "payment_proof_url" TEXT;
