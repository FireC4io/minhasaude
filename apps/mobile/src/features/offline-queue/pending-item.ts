import type {
  CreateBodyMeasurementDto,
  CreateDiaryEntryDto,
  FoodResponseDto,
  PortionResponseDto,
} from '@/api/generated/models';

/**
 * Anotação do diário guardada no aparelho até chegar ao servidor. Leva o
 * alimento e a medida junto para a tela Hoje mostrar a anotação (e somar as
 * calorias) mesmo sem internet.
 */
export interface PendingDiaryItem {
  kind: 'diary';
  clientId: string;
  createdAt: string;
  data: CreateDiaryEntryDto & { clientId: string };
  food: FoodResponseDto;
  portion: PortionResponseDto | null;
}

export interface PendingWeightItem {
  kind: 'weight';
  clientId: string;
  createdAt: string;
  data: CreateBodyMeasurementDto & { clientId: string };
}

export type PendingItem = PendingDiaryItem | PendingWeightItem;

/** O servidor recusou (alimento apagado, consentimento retirado...): a pessoa precisa saber. */
export interface FailedItem {
  clientId: string;
  kind: PendingItem['kind'];
  /** Nome do alimento ou o peso, para dizer qual anotação não foi. */
  label: string;
}

export interface PendingState {
  items: readonly PendingItem[];
  failed: readonly FailedItem[];
}

export const EMPTY_PENDING_STATE: PendingState = { items: [], failed: [] };

export function isPendingDiary(item: PendingItem): item is PendingDiaryItem {
  return item.kind === 'diary';
}

export function isPendingWeight(item: PendingItem): item is PendingWeightItem {
  return item.kind === 'weight';
}
