import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateIngresoDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @IsNotEmpty()
  @IsString()
  concepto: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  mes: number;

  @IsNotEmpty()
  @IsNumber()
  anio: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
