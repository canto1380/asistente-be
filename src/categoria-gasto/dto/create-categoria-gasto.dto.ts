import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoriaGastoDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsOptional()
    descripcion?: string;
}
