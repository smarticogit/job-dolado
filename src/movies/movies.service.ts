import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Movie } from 'src/typeorm/entities/Movie';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Movie) private movieRepository: Repository<Movie>,
  ) {}

  async create(createMovieDto: CreateMovieDto) {
    const { title, notes } = createMovieDto;
    const formattedTitle = title.trim().replace(/\s+/g, '%20');
    const baseUrl = `http://www.omdbapi.com/?apikey=aa9290ba&t=${formattedTitle}`;

    try {
      const { data } = await firstValueFrom(this.httpService.get(baseUrl));

      if (!data || !data.Response) {
        throw new Error('Movie not found on OMDB API');
      }

      const movieCreated = this.movieRepository.create({
        notes,
        title: data.Title,
        released: data.Released || '',
        imdb_id: data.imdbID || '',
      } as ResponseOmdb);

      const movieSaved = await this.movieRepository.save(movieCreated);

      return movieSaved;
    } catch (error) {
      console.error('Error while creating movie:', error);
      throw new Error('Error while creating movie: ' + error.message);
    }
  }

  async findAll() {
    return await this.movieRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} movie`;
  }

  update(id: number, updateMovieDto: UpdateMovieDto) {
    return `This action updates a #${id}, ${updateMovieDto} movie`;
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}

interface ResponseOmdb {
  notes: string;
  title: string;
  released?: string;
  director?: string;
  writer?: string;
  actors?: string;
  ratings?: string;
  imdbID?: string;
}
