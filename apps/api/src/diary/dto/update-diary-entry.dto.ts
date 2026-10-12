import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDiaryEntryDto } from './create-diary-entry.dto';

// O clientId só identifica a criação (reenvio da fila sem internet); não se edita.
export class UpdateDiaryEntryDto extends PartialType(OmitType(CreateDiaryEntryDto, ['clientId'] as const)) {}
