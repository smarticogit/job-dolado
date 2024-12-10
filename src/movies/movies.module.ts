import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../typeorm/entities/Movie';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MovieRepository } from './typeORM.repository';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Movie])],
  controllers: [MoviesController],
  providers: [
    MoviesService,
    {
      provide: 'IMovieRepository',
      useClass: MovieRepository,
    },
  ],
})
export class MoviesModule {}
