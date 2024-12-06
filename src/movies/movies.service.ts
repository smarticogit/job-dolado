import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly httpService: HttpService) {}

  async create(createMovieDto: CreateMovieDto) {
    const { title } = createMovieDto;
    const formattedTitle = title.trim().replace(/\s+/g, '%20');
    const baseUrl = `http://www.omdbapi.com/?apikey=aa9290ba&t=${formattedTitle}`;

    try {
      const { data } = await firstValueFrom(this.httpService.get(baseUrl));
      return data;
    } catch (error) {
      console.error('Error accessing movies on OMDb', error.message);
      throw new Error('Error accessing movies on OMDb');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} movie`;
  }

  update(id: number, updateMovieDto: UpdateMovieDto) {
    return `This action updates a #${id} movie`;
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}
