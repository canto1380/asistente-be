import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { IngresosService } from "./ingresos.service";
import { IngresosController } from "./ingresos.controller";

@Module({
  imports: [],
  controllers: [IngresosController],
  providers: [IngresosService, PrismaService],
})
export class IngresosModule {}