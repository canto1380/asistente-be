-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_eventoId_fkey";

-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_listaTareaId_fkey";

-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_tareaId_fkey";

-- DropForeignKey
ALTER TABLE "Tarea" DROP CONSTRAINT "Tarea_listaTareaId_fkey";

-- AlterTable
ALTER TABLE "Recordatorio" ALTER COLUMN "activador" SET DATA TYPE TIMESTAMPTZ(3);

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_listaTareaId_fkey" FOREIGN KEY ("listaTareaId") REFERENCES "ListaTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_listaTareaId_fkey" FOREIGN KEY ("listaTareaId") REFERENCES "ListaTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
