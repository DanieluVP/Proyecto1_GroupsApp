import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { GroupMember } from './group-member.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  adminId: string;

  @OneToMany(() => GroupMember, (gm) => gm.group, { eager: false })
  groupMembers: GroupMember[];

  @CreateDateColumn()
  createdAt: Date;
}
