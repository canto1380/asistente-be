/*
  Warnings:

  - Added the required column `anio` to the `ListaTarea` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ListaTarea" ADD COLUMN     "anio" TEXT NOT NULL;
