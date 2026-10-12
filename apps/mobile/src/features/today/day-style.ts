/** Moldura do dia na semana e no calendário: cheio se escolhido, contorno se for hoje. */
export function dayFrame(selected: boolean, isToday: boolean): string {
  if (selected) return 'bg-mamao-forte';
  return isToday ? 'border-2 border-mamao-forte' : '';
}

/** Pontinho de "tem anotação", claro sobre o dia escolhido. */
export function entryDot(hasEntries: boolean, selected: boolean): string {
  if (!hasEntries) return '';
  return selected ? 'bg-areia' : 'bg-couve';
}
