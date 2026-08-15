-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "localPhotos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
