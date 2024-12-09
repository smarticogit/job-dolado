import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Movie } from '../typeorm/entities/Movie';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Movie) private movieRepository: Repository<Movie>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const { title, notes } = createMovieDto;
    const formattedTitle = title.trim().replace(/\s+/g, '%20');
    const baseUrl = process.env.MOVIES_BASE_URL;
    const makeUrl = `${baseUrl}=${formattedTitle}`;

    const { data } = await firstValueFrom(this.httpService.get(makeUrl));

    if (data.Response === 'False') {
      throw new NotFoundException(`Error: ${data.Error}`);
    }

    const movieAlreadyExists = await this.movieRepository.findOneBy({
      imdb_id: data.imdbID,
    });

    if (movieAlreadyExists) {
      throw new BadRequestException(
        `Movie with IMDB ID ${data.imdbID} already exists`,
      );
    }

    const released = data.Released === 'N/A' ? null : new Date(data.Released);

    const movieCreated = this.movieRepository.create({
      notes,
      title: data.Title,
      released,
      imdb_id: data.imdbID,
      director: data.Director,
      writer: data.Writer,
      actors: data.Actors,
      imdb_ratings: isNaN(parseFloat(data.imdbRating))
        ? 0
        : parseFloat(data.imdbRating),
    } as ResponseOmdb);

    const movieSaved = await this.movieRepository.save(movieCreated);

    if (!movieSaved) {
      throw new BadRequestException('Error saving movie');
    }

    return movieSaved;
  }

  async findAll(
    sortBy = 'released',
    order: 'ASC' | 'DESC' = 'ASC',
    filters?: { title?: string; search?: string },
  ): Promise<Movie[]> {
    const validSortFields = ['released', 'imdb_ratings'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'released';

    const query = this.movieRepository.createQueryBuilder('movie');

    if (filters?.title) {
      query.andWhere('LOWER(movie.title) LIKE :title', {
        title: `%${filters.title.toLowerCase()}%`,
      });
    }

    if (filters?.search) {
      query.andWhere(
        `
          (LOWER(movie.director) LIKE :search 
          OR LOWER(movie.actors) LIKE :search 
          OR LOWER(movie.writer) LIKE :search)
        `,
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    query.orderBy(`COALESCE(movie.${sortField}, 0)`, order);

    return await query.getMany();
  }

  private async findMovieByIdOrThrow(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOneBy({ id });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async findOne(id: number): Promise<Movie> {
    await this.findMovieByIdOrThrow(id);

    const movie = await this.movieRepository.findOneBy({ id });
    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    await this.findMovieByIdOrThrow(id);
    const { notes } = updateMovieDto;

    await this.movieRepository.update(id, { notes });
    return await this.movieRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findMovieByIdOrThrow(id);

    const movieDeleted = await this.movieRepository.delete(id);

    if (!movieDeleted.affected) {
      throw new BadRequestException('Error deleting movie');
    }

    return { message: `Movie with ID ${id} has been removed successfully` };
  }
}

interface ResponseOmdb {
  notes: string;
  title: string;
  released?: Date | null;
  director?: string;
  writer?: string;
  actors?: string;
  ratings?: string;
  imdbID?: string;
}
