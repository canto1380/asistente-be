import { IsNotEmpty, IsString } from "class-validator";

export class CreatePermisoDto {

    @IsString()
    @IsNotEmpty()
    codigo: string;
  
    @IsString()
    @IsNotEmpty()
    descripcion: string;
}
