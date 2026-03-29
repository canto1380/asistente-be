import { PartialType } from '@nestjs/mapped-types';
import { CreateListaTareaDto } from './create-lista-tarea.dto';

export class UpdateListaTareaDto extends PartialType(CreateListaTareaDto) {}

