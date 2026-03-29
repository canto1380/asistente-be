/*
  Warnings:

  - Added the required column `mes` to the `ListaTarea` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ListaTarea" ADD COLUMN     "mes" TEXT NOT NULL;
