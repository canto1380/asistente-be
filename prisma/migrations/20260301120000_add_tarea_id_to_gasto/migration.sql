-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN "tareaId" TEXT;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;