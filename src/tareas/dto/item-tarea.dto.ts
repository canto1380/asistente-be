import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ItemTareaDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @MinLength(1)
  texto: string;

  @IsBoolean()
  @IsOptional()
  completado?: boolean;

  @IsInt()
  @IsOptional()
  orden?: number;
}
