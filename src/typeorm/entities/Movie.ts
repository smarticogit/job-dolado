import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  notes: string;

  @Column({ type: 'date', nullable: true })
  released: Date | null;

  @Column()
  imdb_id: string;

  @Column('float')
  imdb_ratings: number;

  @Column()
  director: string;

  @Column()
  writer: string;

  @Column()
  actors: string;
}
