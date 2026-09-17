import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { BodyMeasurement } from '../database/entities/body-measurement.entity';
import type { CreateBodyMeasurementDto } from './dto/create-body-measurement.dto';
import type { ListBodyMeasurementsQueryDto } from './dto/list-body-measurements-query.dto';
import type { PaginatedResult } from '../common/types/paginated-result.interface';

@Injectable()
export class BodyMeasurementsService {
  constructor(
    @InjectRepository(BodyMeasurement) private readonly measurements: Repository<BodyMeasurement>,
  ) {}

  async create(userId: string, dto: CreateBodyMeasurementDto): Promise<BodyMeasurement> {
    const measurement = this.measurements.create({
      userId,
      measuredAt: new Date(dto.measuredAt),
      source: dto.source,
      weightKg: dto.weightKg.toString(),
      bodyFatPercent: dto.bodyFatPercent !== undefined ? dto.bodyFatPercent.toString() : null,
      muscleMassKg: dto.muscleMassKg !== undefined ? dto.muscleMassKg.toString() : null,
      leanMassKg: dto.leanMassKg !== undefined ? dto.leanMassKg.toString() : null,
      rawPayload: null,
    });
    return this.measurements.save(measurement);
  }

  async list(
    userId: string,
    query: ListBodyMeasurementsQueryDto,
  ): Promise<PaginatedResult<BodyMeasurement>> {
    const page = query.page;
    const limit = query.limit;

    const where: FindOptionsWhere<BodyMeasurement> = { userId };
    if (query.source) {
      where.source = query.source;
    }
    if (query.from && query.to) {
      where.measuredAt = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where.measuredAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where.measuredAt = LessThanOrEqual(new Date(query.to));
    }

    const [data, total] = await this.measurements.findAndCount({
      where,
      order: { measuredAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }

  // Usado por GET /v1/me/export - histórico completo, não só a página atual.
  async listAll(userId: string): Promise<BodyMeasurement[]> {
    return this.measurements.find({ where: { userId }, order: { measuredAt: 'DESC' } });
  }

  // Usado por GoalsService - peso (e % de gordura, se houver) mais recente
  // como input do cálculo de TMB/TDEE.
  async findLatest(userId: string): Promise<BodyMeasurement | null> {
    return this.measurements.findOne({ where: { userId }, order: { measuredAt: 'DESC' } });
  }
}
