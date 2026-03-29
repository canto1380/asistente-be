-- DropForeignKey
ALTER TABLE "Tarea" DROP CONSTRAINT "Tarea_listaTareaId_fkey";

-- AlterTable
ALTER TABLE "Tarea" ALTER COLUMN "listaTareaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_listaTareaId_fkey" FOREIGN KEY ("listaTareaId") REFERENCES "ListaTarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
