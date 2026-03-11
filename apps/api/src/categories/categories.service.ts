import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId, isDeleted: false },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { userId, name: dto.name, color: dto.color, icon: dto.icon },
    });
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat || cat.isDeleted) throw new NotFoundException('Category not found');
    if (cat.userId !== userId) throw new ForbiddenException();
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat || cat.isDeleted) throw new NotFoundException('Category not found');
    if (cat.userId !== userId) throw new ForbiddenException();
    return this.prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
