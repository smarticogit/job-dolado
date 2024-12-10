import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Movie } from 'src/typeorm/entities/Movie';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { IMovieRepository } from './movie.repository';

@Injectable()
export class MovieRepository implements IMovieRepository {
  constructor(
    @InjectRepository(Movie) private readonly repository: Repository<Movie>,
    private readonly httpService: HttpService,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const { title, notes } = createMovieDto;
    const formattedTitle = title.trim().replace(/\s+/g, '%20');
    const baseUrl = process.env.OMDB_URL;
    const apiKey = process.env.OMDB_KEY;
    const makeUrl = `${baseUrl}?apikey=${apiKey}&t=${formattedTitle}`;

    const { data } = await firstValueFrom(
      this.httpService.get<ResponseOmdb>(makeUrl),
    );

    if (data.Response === 'False') {
      throw new NotFoundException(`Error: ${data.Error}`);
    }

    const movieAlreadyExists = await this.repository.findOneBy({
      imdb_id: data.imdbID,
    });

    if (movieAlreadyExists) {
      throw new BadRequestException(
        `Movie with IMDB ID ${data.imdbID} already exists`,
      );
    }

    const released =
      data.Released && data.Released !== 'N/A' ? new Date(data.Released) : null;

    const movieCreated = this.repository.create({
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
    });

    const movieSaved = await this.repository.save(movieCreated);

    if (!movieSaved) {
      throw new BadRequestException('Error saving movie');
    }

    return movieSaved;
  }

  findOneBy(criteria: Partial<Movie>): Promise<Movie | null> {
    return this.repository.findOneBy(criteria);
  }

  async findAll(
    sortBy: string,
    order: 'ASC' | 'DESC',
    filters?: { title?: string; search?: string },
  ): Promise<Movie[]> {
    const query = this.repository.createQueryBuilder('movie');

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

    query.orderBy(`COALESCE(movie.${sortBy}, 0)`, order);

    return await query.getMany();
  }

  findById(id: number): Promise<Movie | null> {
    return this.repository.findOneBy({ id });
  }

  async update(id: number, updateData: Partial<Movie>): Promise<void> {
    await this.repository.update(id, updateData);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}

interface ResponseOmdb {
  Title: string;
  Released: string;
  Director: string;
  Writer: string;
  Actors: string;
  imdbRating: string;
  imdbID: string;
  Response: string;
  Error?: string;
}
