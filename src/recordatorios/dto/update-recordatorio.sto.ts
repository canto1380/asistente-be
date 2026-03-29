import { IsDateString, IsNotEmpty, IsString } from "class-validator";


export class UpdateRecordatorioDto {
    @IsDateString()
    @IsNotEmpty()
    activador: string;

}