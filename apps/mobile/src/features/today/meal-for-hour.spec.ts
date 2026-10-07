import { mealForHour } from './meal-for-hour';

describe('mealForHour', () => {
  it.each([
    [6, 'breakfast'],
    [10, 'breakfast'],
    [11, 'lunch'],
    [14, 'lunch'],
    [15, 'snack'],
    [17, 'snack'],
    [18, 'dinner'],
    [23, 'dinner'],
    [2, 'dinner'],
  ])('%sh sugere %s', (hour, meal) => {
    expect(mealForHour(hour)).toBe(meal);
  });
});
