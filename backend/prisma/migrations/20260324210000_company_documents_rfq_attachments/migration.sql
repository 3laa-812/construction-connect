-- CreateTable
CREATE TABLE IF NOT EXISTS "company_documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "rfq_attachments" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,

    CONSTRAINT "rfq_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_documents_company_id_idx" ON "company_documents"("company_id");
CREATE INDEX IF NOT EXISTS "rfq_attachments_rfq_id_idx" ON "rfq_attachments"("rfq_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_documents_company_id_fkey'
  ) THEN
    ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rfq_attachments_rfq_id_fkey'
  ) THEN
    ALTER TABLE "rfq_attachments" ADD CONSTRAINT "rfq_attachments_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
