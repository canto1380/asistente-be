-- AlterTable
ALTER TABLE "Recordatorio" ADD COLUMN     "listaTareaId" TEXT;

-- AddForeignKey
ALTER TABLE "Recordatorio" ADD CONSTRAINT "Recordatorio_listaTareaId_fkey" FOREIGN KEY ("listaTareaId") REFERENCES "ListaTarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
