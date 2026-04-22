import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller()
export class AuthGrpcController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken({ token }: { token: string }) {
    try {
      const payload = this.authService.verifyToken(token);
      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        username: payload.username,
      };
    } catch {
      return { valid: false, userId: '', email: '', username: '' };
    }
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser({ userId }: { userId: string }) {
    const user = await this.usersService.findById(userId);
    if (!user) return { valid: false, userId: '', email: '', username: '' };
    return { valid: true, userId: user.id, email: user.email, username: user.username };
  }
}
