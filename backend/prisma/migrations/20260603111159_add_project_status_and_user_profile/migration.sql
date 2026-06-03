-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'berjalan';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT;
