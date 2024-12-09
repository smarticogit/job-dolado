/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpService } from '@nestjs/axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { MoviesService } from '../src/movies/movies.service';
import { Movie } from '../src/typeorm/entities/Movie';

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: Repository<Movie>;
  let httpService: HttpService;

  const mockMovieRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a new movie', async () => {
      const createMovieDto = { title: 'Inception', notes: 'Great movie' };

      const omdbApiResponse = {
        Response: 'True',
        Title: 'Inception',
        Released: '2010-07-16',
        imdbID: 'tt1375666',
        Director: 'Christopher Nolan',
        Writer: 'Christopher Nolan',
        Actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
        imdbRating: '8.8',
      };

      mockHttpService.get.mockReturnValue(of({ data: omdbApiResponse }));

      mockMovieRepository.findOneBy.mockResolvedValue(null);
      mockMovieRepository.create.mockReturnValue(omdbApiResponse);
      mockMovieRepository.save.mockResolvedValue(omdbApiResponse);

      const result = await service.create(createMovieDto);

      expect(result).toEqual(omdbApiResponse);
      expect(mockMovieRepository.findOneBy).toHaveBeenCalledWith({
        imdb_id: 'tt1375666',
      });
      expect(mockMovieRepository.save).toHaveBeenCalled();
    });

    it('should throw an error if movie already exists', async () => {
      const createMovieDto = { title: 'Inception', notes: 'Great movie' };

      const omdbApiResponse = {
        Response: 'True',
        Title: 'Inception',
        Released: '2010-07-16',
        imdbID: 'tt1375666',
        Director: 'Christopher Nolan',
        Writer: 'Christopher Nolan',
        Actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
        imdbRating: '8.8',
      };

      mockHttpService.get.mockReturnValue(of({ data: omdbApiResponse }));

      mockMovieRepository.findOneBy.mockResolvedValue(omdbApiResponse); // Simulando que o filme já existe

      await expect(service.create(createMovieDto)).rejects.toThrowError(
        new BadRequestException(`Movie with IMDB ID tt1375666 already exists`),
      );
    });

    it('should throw an error if OMDB API returns error', async () => {
      const createMovieDto = { title: 'Nonexistent Movie', notes: 'Bad movie' };

      mockHttpService.get.mockReturnValue(
        of({ data: { Response: 'False', Error: 'Movie not found!' } }),
      );

      await expect(service.create(createMovieDto)).rejects.toThrowError(
        new NotFoundException('Error: Movie not found!'),
      );
    });
  });

  describe('findAll', () => {
    it('should return a list of movies', async () => {
      const filters = { title: 'Inception' };
      const mockMovies = [
        {
          title: 'Inception',
          director: 'Christopher Nolan',
          imdb_id: 'tt1375666',
        },
      ];

      mockMovieRepository.getMany.mockResolvedValue(mockMovies);

      const result = await service.findAll('released', 'ASC', filters);

      expect(result).toEqual(mockMovies);
      expect(mockMovieRepository.getMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a movie by id', async () => {
      const mockMovie = { title: 'Inception', imdb_id: 'tt1375666' };
      mockMovieRepository.findOneBy.mockResolvedValue(mockMovie);

      const result = await service.findOne(1);

      expect(result).toEqual(mockMovie);
      expect(mockMovieRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw an error if movie is not found', async () => {
      mockMovieRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrowError(
        new NotFoundException('Movie with ID 1 not found'),
      );
    });
  });

  describe('update', () => {
    it('should update movie notes successfully', async () => {
      const mockMovie = { id: 1, title: 'Inception', notes: 'Updated notes' };
      const updateMovieDto = { notes: 'Updated notes' };

      mockMovieRepository.findOneBy.mockResolvedValue(mockMovie);
      mockMovieRepository.update.mockResolvedValue({
        ...mockMovie,
        ...updateMovieDto,
      });

      const result = await service.update(1, updateMovieDto);

      expect(result.notes).toEqual('Updated notes');
      expect(mockMovieRepository.update).toHaveBeenCalledWith(1, {
        notes: 'Updated notes',
      });
    });

    it('should throw an error if movie is not found', async () => {
      const updateMovieDto = { notes: 'Updated notes' };

      mockMovieRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(1, updateMovieDto)).rejects.toThrowError(
        new NotFoundException('Movie with ID 1 not found'),
      );
    });
  });

  describe('remove', () => {
    it('should remove a movie successfully', async () => {
      const mockMovie = { id: 1, title: 'Inception' };

      mockMovieRepository.findOneBy.mockResolvedValue(mockMovie);
      mockMovieRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);

      expect(result.message).toEqual(
        'Movie with ID 1 has been removed successfully',
      );
      expect(mockMovieRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw an error if movie is not found', async () => {
      mockMovieRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrowError(
        new NotFoundException('Movie with ID 1 not found'),
      );
    });

    it('should throw an error if delete fails', async () => {
      const mockMovie = { id: 1, title: 'Inception' };

      mockMovieRepository.findOneBy.mockResolvedValue(mockMovie);
      mockMovieRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1)).rejects.toThrowError(
        new BadRequestException('Error deleting movie'),
      );
    });
  });
});
