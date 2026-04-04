-- Daily logs & photos (schema had models but no prior CREATE TABLE in migration chain).

CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "weather_data" JSONB,
    "attendance_data" JSONB,
    "material_receipt_data" JSONB,
    "status" "DailyLogStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "log_photos" (
    "id" TEXT NOT NULL,
    "daily_log_id" TEXT NOT NULL,
    "local_path" TEXT,
    "s3_url" TEXT,
    "gps_lat" DECIMAL(10,8),
    "gps_long" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_photos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "log_photos" ADD CONSTRAINT "log_photos_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "daily_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
