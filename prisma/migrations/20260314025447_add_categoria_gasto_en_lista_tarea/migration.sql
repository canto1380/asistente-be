/*
  Warnings:

  - Added the required column `categoriaGastoId` to the `ListaTarea` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ListaTarea" ADD COLUMN     "categoriaGastoId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ListaTarea" ADD CONSTRAINT "ListaTarea_categoriaGastoId_fkey" FOREIGN KEY ("categoriaGastoId") REFERENCES "CategoriaGasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
