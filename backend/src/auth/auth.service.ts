import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class AuthService {
  private User: any;

  constructor(
    @Inject(SEQUELIZE) private sequelize: Sequelize,
    private jwtService: JwtService,
  ) {
    this.User = this.sequelize.model('User');
  }

  private generateToken(user: any): string {
    return this.jwtService.sign({ id: user.id, email: user.email, role: user.role, name: user.name });
  }

  async registerCustomer(dto: { name: string; email: string; phone?: string; password: string }) {
    const existing = await this.User.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      password: hashed,
      role: 'customer',
      isVerified: true,
    });

    return { _id: String(user.id), name: user.name, email: user.email, role: user.role, token: this.generateToken(user) };
  }

  async registerAdmin(dto: { name: string; email: string; phone?: string; password: string; accessCode: string; address?: any; dateOfBirth?: string; role?: string }) {
    if (dto.accessCode !== process.env.ADMIN_ACCESS_CODE) {
      throw new BadRequestException('Invalid admin access code');
    }

    const existing = await this.User.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const finalRole = ['admin', 'teller', 'business_partner'].includes(dto.role ?? '') ? dto.role : 'admin';
    const user = await this.User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      password: hashed,
      role: finalRole,
      address: dto.address ?? {},
      dateOfBirth: dto.dateOfBirth ?? null,
      isVerified: true,
    });

    return { _id: String(user.id), name: user.name, email: user.email, role: user.role, token: this.generateToken(user) };
  }

  async loginUser(dto: { email: string; password: string }) {
    const user = await this.User.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const hashedPw = user.getDataValue('password');
    const isMatch  = await bcrypt.compare(dto.password, hashedPw);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return {
      _id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      token: this.generateToken(user),
    };
  }

  async getMe(userId: number) {
    const user = await this.User.findByPk(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
