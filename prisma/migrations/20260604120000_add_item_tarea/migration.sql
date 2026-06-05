-- CreateTable
CREATE TABLE "ItemTarea" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemTarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemTarea_tareaId_idx" ON "ItemTarea"("tareaId");

-- AddForeignKey
ALTER TABLE "ItemTarea" ADD CONSTRAINT "ItemTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
