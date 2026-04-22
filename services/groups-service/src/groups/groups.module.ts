import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupsController } from './groups.controller';
import { GroupsGrpcController } from './groups.grpc.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupMember])],
  controllers: [GroupsController, GroupsGrpcController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
