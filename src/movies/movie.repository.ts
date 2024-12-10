import { Movie } from 'src/typeorm/entities/Movie';

export interface IMovieRepository {
  create(movie: Partial<Movie>): Promise<Movie>;
  findOneBy(criteria: Partial<Movie>): Promise<Movie | null>;
  findAll(
    sortBy: string,
    order: 'ASC' | 'DESC',
    filters?: { title?: string; search?: string },
  ): Promise<Movie[]>;
  findById(id: number): Promise<Movie | null>;
  update(id: number, updateData: Partial<Movie>): Promise<void>;
  delete(id: number): Promise<boolean>;
}
