-- DropForeignKey
ALTER TABLE "RolPermiso" DROP CONSTRAINT "RolPermiso_rolId_fkey";

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
