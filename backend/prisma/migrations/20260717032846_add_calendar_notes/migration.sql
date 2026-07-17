-- CreateTable
CREATE TABLE "calendar_notes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_notes_user_id_date_idx" ON "calendar_notes"("user_id", "date");

-- AddForeignKey
ALTER TABLE "calendar_notes" ADD CONSTRAINT "calendar_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
