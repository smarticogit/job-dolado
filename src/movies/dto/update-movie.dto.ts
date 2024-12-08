import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { CreateMovieDto } from './create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @IsString()
  notes?: string;
}
