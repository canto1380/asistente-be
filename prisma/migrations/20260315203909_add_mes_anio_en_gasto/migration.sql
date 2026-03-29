/*
  Warnings:

  - You are about to drop the column `fecha` on the `Gasto` table. All the data in the column will be lost.
  - Added the required column `anio` to the `Gasto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mes` to the `Gasto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gasto" DROP COLUMN "fecha",
ADD COLUMN     "anio" TEXT NOT NULL,
ADD COLUMN     "mes" TEXT NOT NULL;
