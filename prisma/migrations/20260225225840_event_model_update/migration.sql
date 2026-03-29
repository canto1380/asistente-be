-- AlterTable
ALTER TABLE "Evento" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA';
