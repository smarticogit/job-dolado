import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Movie } from '../typeorm/entities/Movie';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { IMovieRepository } from './movie.repository';

@Injectable()
export class MoviesService {
  constructor(
    @Inject('IMovieRepository')
    private readonly moviesRepository: IMovieRepository,
  ) {}

  create(movie: Partial<Movie>): Promise<Movie> {
    return this.moviesRepository.create(movie);
  }

  async findAll(
    sortBy = 'released',
    order: 'ASC' | 'DESC' = 'ASC',
    filters?: { title?: string; search?: string },
  ): Promise<Movie[]> {
    return await this.moviesRepository.findAll(sortBy, order, filters);
  }

  private async findMovieByIdOrThrow(id: number): Promise<Movie> {
    const movie = await this.moviesRepository.findOneBy({ id });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async findOne(id: number): Promise<Movie> {
    return this.findMovieByIdOrThrow(id);
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    await this.findMovieByIdOrThrow(id);
    const { notes } = updateMovieDto;

    await this.moviesRepository.update(id, { notes });
    return await this.moviesRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findMovieByIdOrThrow(id);

    const movieDeleted = await this.moviesRepository.delete(id);

    if (!movieDeleted) {
      throw new BadRequestException('Error deleting movie');
    }

    return { message: `Movie with ID ${id} has been removed successfully` };
  }
}
