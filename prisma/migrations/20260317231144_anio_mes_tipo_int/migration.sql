/*
  Warnings:

  - Changed the type of `anio` on the `Gasto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mes` on the `Gasto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mes` on the `ListaTarea` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `anio` on the `ListaTarea` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Gasto" DROP COLUMN "anio",
ADD COLUMN     "anio" INTEGER NOT NULL,
DROP COLUMN "mes",
ADD COLUMN     "mes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ListaTarea" DROP COLUMN "mes",
ADD COLUMN     "mes" INTEGER NOT NULL,
DROP COLUMN "anio",
ADD COLUMN     "anio" INTEGER NOT NULL;
