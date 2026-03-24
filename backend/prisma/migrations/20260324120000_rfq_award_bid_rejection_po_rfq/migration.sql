-- AlterTable
ALTER TABLE "bids" ADD COLUMN "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "rfqs" ADD COLUMN "awarded_bid_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_awarded_bid_id_key" ON "rfqs"("awarded_bid_id");

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_awarded_bid_id_fkey" FOREIGN KEY ("awarded_bid_id") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN "rfq_id" UUID;
ALTER TABLE "purchase_orders" ADD COLUMN "payment_terms" "PaymentTerm";
ALTER TABLE "purchase_orders" ADD COLUMN "delivery_date_required" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
