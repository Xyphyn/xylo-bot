/*
  Warnings:

  - Added the required column `reason` to the `Warning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Warning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Warning" ADD COLUMN     "reason" STRING NOT NULL;
ALTER TABLE "Warning" ADD COLUMN     "time" TIMESTAMP(3) NOT NULL;
