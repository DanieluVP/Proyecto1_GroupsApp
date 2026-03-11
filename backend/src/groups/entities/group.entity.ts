import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, { eager: true })
  admin: User;

  @ManyToMany(() => User, (user) => user.groups, { eager: true })
  @JoinTable()
  members: User[];

  @CreateDateColumn()
  createdAt: Date;
}
