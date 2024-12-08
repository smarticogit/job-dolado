import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMovieDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Notes must not be empty' })
  title: string;

  @IsString({ message: 'Notes must be a string' })
  @IsNotEmpty({ message: 'Notes must not be empty' })
  notes: string;
}
