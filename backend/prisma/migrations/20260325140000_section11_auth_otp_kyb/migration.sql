-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "otp_hash" VARCHAR(255),
ADD COLUMN "otp_expires_at" TIMESTAMP(3);

ALTER TABLE "companies" ADD COLUMN "address" TEXT,
ADD COLUMN "supplier_categories" VARCHAR(512);
