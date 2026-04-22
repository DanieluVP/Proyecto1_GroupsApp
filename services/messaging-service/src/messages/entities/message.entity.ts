import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { MessageRead } from './message-read.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column()
  senderId: string;

  @Column({ nullable: true })
  senderUsername?: string;

  @Column()
  targetId: string;

  @Column()
  targetType: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @OneToMany(() => MessageRead, (mr) => mr.message, { eager: false })
  reads: MessageRead[];

  @CreateDateColumn()
  createdAt: Date;
}
