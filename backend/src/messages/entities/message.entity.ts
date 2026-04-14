import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MessageRead } from './message-read.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column()
  senderId: string;

  @Column()
  targetId: string;

  @Column()
  targetType: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @OneToMany(() => MessageRead, (mr) => mr.message, { eager: false })
  reads: MessageRead[];

  @CreateDateColumn()
  createdAt: Date;
}
